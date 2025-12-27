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
        HttpSession httpSession = (HttpSession) session.getAttributes().get("httpSession");
        if (httpSession == null) {
            session.close();
            return;
        }

        User currentUser = (User) httpSession.getAttribute("currentUser");
        if (currentUser == null) {
            session.close();
            return;
        }

        String room = Objects.requireNonNull(session.getUri())
                .getPath().replaceAll(".*/", "");

        UserCtx ctx = new UserCtx();
        ctx.room = room;
        ctx.userId = currentUser.getUserId();
        ctx.username = currentUser.getUsername();
        ctx.role = currentUser.getRoles().toString();

        CONTEXT.put(session, ctx);
        ROOMS.computeIfAbsent(room, k -> ConcurrentHashMap.newKeySet()).add(session);

        // SEND HISTORY
        var historyMessages = messageService.findRecentByRoom(room, 50)
                .stream()
                .map(m -> ChatMessageMapper.toResponse(m, "CHAT"))
                .toList();

        ChatHistoryResponse historyResponse = ChatHistoryResponse.builder()
                .type("HISTORY")
                .room(room)
                .messages(historyMessages)
                .build();

        session.sendMessage(
                new TextMessage(objectMapper.writeValueAsString(historyResponse))
        );

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
                ChatMessageMapper.toResponse(entity, "CHAT");

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

    // BROADCAST
    private void broadcast(String room, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            for (WebSocketSession s : ROOMS.getOrDefault(room, Set.of())) {
                s.sendMessage(new TextMessage(json));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
