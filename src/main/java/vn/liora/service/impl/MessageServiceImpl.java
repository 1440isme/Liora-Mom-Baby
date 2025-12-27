package vn.liora.service.impl;

import org.springframework.data.domain.PageRequest;
import vn.liora.dto.response.ChatRoomInfo;
import vn.liora.entity.Message;
import vn.liora.entity.User;
import vn.liora.repository.MessageRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    public Message save(Message message) {
        return messageRepository.save(message);
    }

    @Override
    public List<Message> findRecentByRoom(String roomId, int limit) {
        return messageRepository.findByRoomIdOrderByCreatedAtDesc(
                roomId,
                PageRequest.of(0, limit)
        );
    }

    @Override
    public List<String> findAllRooms() {
        return messageRepository.findDistinctRoomIds();
    }
    
    @Override
    public List<ChatRoomInfo> findAllRoomsWithUserInfo() {
        List<String> roomIds = messageRepository.findDistinctRoomIds();
        
        return roomIds.stream().map(roomId -> {
            ChatRoomInfo.ChatRoomInfoBuilder builder = ChatRoomInfo.builder()
                    .roomId(roomId);
            
            // Thử parse roomId như userId (Long)
            try {
                Long userId = Long.parseLong(roomId);
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    String fullName = (user.getFirstname() != null ? user.getFirstname() : "") + 
                                    " " + (user.getLastname() != null ? user.getLastname() : "").trim();
                    String displayName = (fullName.trim().isEmpty()) ? user.getUsername() : fullName.trim();
                    
                    return builder
                            .userId(user.getUserId())
                            .username(user.getUsername())
                            .fullName(fullName.trim())
                            .displayName(displayName)
                            .avatar(user.getAvatar())
                            .build();
                }
            } catch (NumberFormatException e) {
                // Nếu không parse được, thử tìm theo username
                Optional<User> userOpt = userRepository.findByUsername(roomId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    String fullName = (user.getFirstname() != null ? user.getFirstname() : "") + 
                                    " " + (user.getLastname() != null ? user.getLastname() : "").trim();
                    String displayName = (fullName.trim().isEmpty()) ? user.getUsername() : fullName.trim();
                    
                    return builder
                            .userId(user.getUserId())
                            .username(user.getUsername())
                            .fullName(fullName.trim())
                            .displayName(displayName)
                            .avatar(user.getAvatar())
                            .build();
                }
            }
            
            // Nếu không tìm thấy user trực tiếp, thử lấy từ messages trong room
            // Tìm message đầu tiên của USER (không phải ADMIN) để lấy thông tin chủ sở hữu room
            List<Message> allMessages = messageRepository.findByRoomIdOrderByCreatedAtDesc(roomId, PageRequest.of(0, 100));
            if (!allMessages.isEmpty()) {
                // Tìm message đầu tiên của user (không phải admin/manager)
                Optional<Message> userMessageOpt = allMessages.stream()
                        .filter(m -> {
                            String role = m.getRole();
                            return role != null && 
                                   !role.equals("ADMIN") && 
                                   !role.equals("ROLE_ADMIN") && 
                                   !role.equals("MANAGER") && 
                                   !role.equals("ROLE_MANAGER");
                        })
                        .findFirst();
                
                // Nếu không tìm thấy message của user, lấy message đầu tiên (cũ nhất) để tìm chủ sở hữu
                Message targetMessage = userMessageOpt.orElse(allMessages.get(allMessages.size() - 1));
                
                // Tìm user từ senderId
                Optional<User> userOpt = userRepository.findById(targetMessage.getSenderId());
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    // Kiểm tra lại role của user để đảm bảo không phải admin
                    boolean isAdmin = user.getRoles().stream()
                            .anyMatch(r -> r.getName().equals("ADMIN") || 
                                         r.getName().equals("ROLE_ADMIN") ||
                                         r.getName().equals("MANAGER") ||
                                         r.getName().equals("ROLE_MANAGER"));
                    
                    // Chỉ lấy nếu không phải admin
                    if (!isAdmin) {
                        String fullName = (user.getFirstname() != null ? user.getFirstname() : "") + 
                                        " " + (user.getLastname() != null ? user.getLastname() : "").trim();
                        String displayName = (fullName.trim().isEmpty()) ? user.getUsername() : fullName.trim();
                        
                        return builder
                                .userId(user.getUserId())
                                .username(user.getUsername())
                                .fullName(fullName.trim())
                                .displayName(displayName)
                                .avatar(user.getAvatar())
                                .build();
                    }
                }
            }
            
            // Nếu không tìm thấy user, trả về thông tin mặc định
            return builder
                    .displayName(roomId)
                    .build();
        }).collect(Collectors.toList());
    }
}
