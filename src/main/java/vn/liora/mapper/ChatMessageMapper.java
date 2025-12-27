package vn.liora.mapper;

import vn.liora.dto.response.ChatMessageResponse;
import vn.liora.entity.Message;
import vn.liora.entity.User;
import vn.liora.repository.UserRepository;

import java.time.OffsetDateTime;
import java.util.Optional;

public class ChatMessageMapper {

    private ChatMessageMapper() {}

    public static ChatMessageResponse toResponse(Message m, String type) {
        return toResponse(m, type, null);
    }

    public static ChatMessageResponse toResponse(Message m, String type, UserRepository userRepository) {
        String avatar = null;
        // Nếu có userRepository, lấy avatar từ User entity
        if (userRepository != null && m.getSenderId() != null) {
            Optional<User> userOpt = userRepository.findById(m.getSenderId());
            if (userOpt.isPresent()) {
                avatar = userOpt.get().getAvatar();
            }
        }
        
        return ChatMessageResponse.builder()
                .type(type)
                .room(m.getRoomId())
                .id(m.getId())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .role(m.getRole())
                .content(m.getContent())
                .imageUrl(m.getImageUrl())
                .avatar(avatar)
                .timestamp(
                        m.getCreatedAt() != null
                                ? m.getCreatedAt().toString()
                                : OffsetDateTime.now().toString()
                )
                .build();
    }
}
