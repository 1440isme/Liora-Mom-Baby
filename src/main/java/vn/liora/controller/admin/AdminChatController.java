package vn.liora.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.response.ChatMessageResponse;
import vn.liora.dto.response.ChatRoomInfo;
import vn.liora.entity.Message;
import vn.liora.entity.User;
import vn.liora.mapper.ChatMessageMapper;
import vn.liora.repository.UserRepository;
import vn.liora.service.MessageService;
import vn.liora.websocket.handler.ChatWebSocketHandler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/api/admin/websocket")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@RequiredArgsConstructor
public class AdminChatController {

    private final MessageService messageService;
    private final UserRepository userRepository;
    private final ChatWebSocketHandler chatWebSocketHandler;

    @GetMapping("/chat-list")
    public String chatList(Model model) {
        List<ChatRoomInfo> rooms = messageService.findAllRoomsWithUserInfo();
        model.addAttribute("rooms", rooms);
        return "admin/websocket/chat-list";
    }

    @GetMapping("/chat-room/{roomId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getChatRoom(@PathVariable String roomId) {
        Map<String, Object> response = new HashMap<>();
        
        // Lấy messages của room và map thành DTOs với avatar
        List<Message> messages = messageService.findRecentByRoom(roomId, 50);
        List<ChatMessageResponse> messageResponses = messages.stream()
                .map(m -> ChatMessageMapper.toResponse(m, "CHAT", userRepository))
                .toList();
        
        response.put("roomId", roomId);
        response.put("messages", messageResponses);
        
        // Lấy thông tin user từ room
        List<ChatRoomInfo> allRooms = messageService.findAllRoomsWithUserInfo();
        ChatRoomInfo roomInfo = allRooms.stream()
                .filter(r -> r.getRoomId().equals(roomId))
                .findFirst()
                .orElse(ChatRoomInfo.builder()
                        .roomId(roomId)
                        .displayName(roomId)
                        .build());
        response.put("roomInfo", roomInfo);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/chat-list")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestParam String room,
            @RequestParam String content,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Lấy current user từ authentication
            User currentUser = findUserByPrincipal(authentication);
            if (currentUser == null) {
                response.put("success", false);
                response.put("message", "User not authenticated");
                return ResponseEntity.status(401).body(response);
            }

            // Lấy role từ Authentication authorities (chính xác hơn)
            String userRole = extractRoleFromAuthentication(authentication);
            
            // Tạo message
            Message message = Message.builder()
                    .roomId(room)
                    .senderId(currentUser.getUserId())
                    .senderName(currentUser.getUsername())
                    .role(userRole)
                    .content(content)
                    .seen(false)
                    .build();

            Message savedMessage = messageService.save(message);

            // Broadcast tin nhắn qua WebSocket để user nhận được ngay lập tức
            try {
                ChatMessageResponse chatResponse = ChatMessageMapper.toResponse(savedMessage, "CHAT", userRepository);
                chatWebSocketHandler.broadcastMessage(room, chatResponse);
            } catch (Exception e) {
                System.err.println("Error broadcasting message: " + e.getMessage());
                e.printStackTrace();
                // Không fail request nếu broadcast lỗi, vì message đã được lưu
            }

            response.put("success", true);
            response.put("message", "Message sent successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error sending message: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Tìm user từ authentication, hỗ trợ cả JWT và OAuth2
     */
    private User findUserByPrincipal(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }

        String principalName = authentication.getName();

        // Thử tìm bằng username trước
        Optional<User> userOpt = userRepository.findByUsername(principalName);
        if (userOpt.isPresent()) {
            return userOpt.get();
        }

        // Thử tìm bằng email
        userOpt = userRepository.findByEmail(principalName);
        return userOpt.orElse(null);
    }

    /**
     * Lấy role từ Authentication authorities
     * Authorities có format "ROLE_ADMIN", "ROLE_MANAGER", etc.
     * Trả về "ADMIN", "MANAGER", etc. (bỏ prefix "ROLE_")
     */
    private String extractRoleFromAuthentication(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return "ADMIN"; // Default fallback
        }

        // Lấy tất cả authorities và tìm role đầu tiên (ưu tiên ADMIN, MANAGER)
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5)) // Bỏ "ROLE_" prefix
                .collect(Collectors.toList());

        // Ưu tiên ADMIN, sau đó MANAGER, sau đó role đầu tiên
        if (roles.contains("ADMIN")) {
            return "ADMIN";
        } else if (roles.contains("MANAGER")) {
            return "MANAGER";
        } else if (!roles.isEmpty()) {
            return roles.get(0);
        }

        return "ADMIN"; // Default fallback
    }
}
