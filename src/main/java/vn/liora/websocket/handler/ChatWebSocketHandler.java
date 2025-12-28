package vn.liora.websocket.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import vn.liora.dto.request.ChatMessageRequest;
import vn.liora.dto.response.ChatHistoryResponse;
import vn.liora.dto.response.ChatMessageResponse;
import vn.liora.entity.Message;
import vn.liora.entity.User;
import vn.liora.mapper.ChatMessageMapper;
import vn.liora.service.MessageService;

import jakarta.servlet.http.HttpSession;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final MessageService messageService;
    private final ObjectMapper objectMapper;
    private final vn.liora.repository.UserRepository userRepository;

    private static final Map<String, Set<WebSocketSession>> ROOMS = new ConcurrentHashMap<>();
    private static final Map<WebSocketSession, UserCtx> CONTEXT = new ConcurrentHashMap<>();

    private static class UserCtx {
        String room;
        Long userId;
        String username;
        String role;
    }

    private void validateMessage(ChatMessageRequest req) {
        String content = Optional.ofNullable(req.getContent()).orElse("").trim();
        String imageUrl = Optional.ofNullable(req.getImageUrl()).orElse("").trim();

        if (content.isEmpty() && imageUrl.isEmpty()) {
            throw new IllegalArgumentException("Message rỗng");
        }
    }
    // CONNECT
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        User currentUser = (User) session.getAttributes().get("currentUser");
        if (currentUser == null) {
            System.err.println("[WS] currentUser is null, closing session " + session.getId());
            session.close();
            return;
        }
        System.out.println("[WS] User connected: " + currentUser.getUsername() + ", session: " + session.getId());

        String room = null;
        try {
            room = Objects.requireNonNull(session.getUri()).getPath().replaceAll(".*/", "");
        } catch (Exception e) {
            System.err.println("[WS] Cannot extract room from URI: " + session.getUri());
            session.close();
            return;
        }
        if (room == null || room.isEmpty()) {
            System.err.println("[WS] Room is null or empty, closing session " + session.getId());
            session.close();
            return;
        }

        UserCtx ctx = new UserCtx();
        ctx.room = room;
        ctx.userId = currentUser.getUserId();
        ctx.username = currentUser.getUsername();
        ctx.role = currentUser.getRoles().stream().findFirst().map(r -> r.getName()).orElse("USER");

        CONTEXT.put(session, ctx);
        ROOMS.computeIfAbsent(room, k -> ConcurrentHashMap.newKeySet()).add(session);
        System.out.println("[WS] User " + ctx.username + " joined room: " + room);

        // SEND HISTORY
        var historyMessages = messageService.findRecentByRoom(room, 50)
                .stream()
                .map(m -> ChatMessageMapper.toResponse(m, "CHAT", userRepository))
                .toList();

        ChatHistoryResponse historyResponse = ChatHistoryResponse.builder()
                .type("HISTORY")
                .room(room)
                .messages(historyMessages)
                .build();

        try {
            session.sendMessage(
                new TextMessage(objectMapper.writeValueAsString(historyResponse))
            );
        } catch (Exception e) {
            System.err.println("[WS] Error sending history to user " + ctx.username + ": " + e.getMessage());
            e.printStackTrace();
            session.close();
            return;
        }

        // ===== BROADCAST JOIN =====
        broadcast(room, ChatMessageResponse.builder()
                .type("JOIN")
                .room(room)
                .senderId(ctx.userId)
                .senderName(ctx.username)
                .role(ctx.role)
                .timestamp(OffsetDateTime.now().toString())
                .build()
        );
    }

    // MESSAGE
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UserCtx ctx = CONTEXT.get(session);
        if (ctx == null) return;

        ChatMessageRequest request =
                objectMapper.readValue(message.getPayload(), ChatMessageRequest.class);

        validateMessage(request);

        String content = Optional.ofNullable(request.getContent()).orElse("").trim();
        String imageUrl = Optional.ofNullable(request.getImageUrl()).orElse("").trim();

        if (content.isEmpty() && imageUrl.isEmpty()) return;

        // SAVE ENTITY
        Message entity = Message.builder()
                .roomId(ctx.room)
                .senderId(ctx.userId)
                .senderName(ctx.username)
                .role(ctx.role)
                .content(content.isEmpty() ? null : content)
                .imageUrl(imageUrl.isEmpty() ? null : imageUrl)
                .seen(false)
                .build();

        messageService.save(entity);

        // BROADCAST CHAT
        ChatMessageResponse response =
                ChatMessageMapper.toResponse(entity, "CHAT", userRepository);

        broadcast(ctx.room, response);
    }

    // DISCONNECT
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UserCtx ctx = CONTEXT.remove(session);
        if (ctx != null) {
            ROOMS.getOrDefault(ctx.room, Set.of()).remove(session);

            broadcast(ctx.room, ChatMessageResponse.builder()
                    .type("LEAVE")
                    .room(ctx.room)
                    .senderId(ctx.userId)
                    .senderName(ctx.username)
                    .role(ctx.role)
                    .timestamp(OffsetDateTime.now().toString())
                    .build()
            );
        }
    }

    // PUBLIC METHOD để admin controller có thể gọi
    public void broadcastMessage(String room, Object payload) {
        broadcast(room, payload);
    }
    
    // BROADCAST
    private void broadcast(String room, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            Set<WebSocketSession> sessions = ROOMS.getOrDefault(room, Set.of());
            System.out.println("[WS] Broadcasting to room: " + room + ", sessions: " + sessions.size());
            
            for (WebSocketSession s : sessions) {
                try {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(json));
                        System.out.println("[WS] Message sent to session: " + s.getId());
                    } else {
                        System.out.println("[WS] Session " + s.getId() + " is closed, removing from room");
                        ROOMS.getOrDefault(room, Set.of()).remove(s);
                    }
                } catch (Exception e) {
                    System.err.println("[WS] Error sending to session " + s.getId() + ": " + e.getMessage());
                    // Remove closed session
                    ROOMS.getOrDefault(room, Set.of()).remove(s);
                }
            }
        } catch (Exception e) {
            System.err.println("[WS] Error in broadcast: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
