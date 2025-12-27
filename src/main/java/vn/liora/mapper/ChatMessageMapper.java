package vn.liora.mapper;

import vn.liora.dto.response.ChatMessageResponse;
import vn.liora.entity.Message;

import java.time.OffsetDateTime;

public class ChatMessageMapper {

    private ChatMessageMapper() {}

    public static ChatMessageResponse toResponse(Message m, String type) {
        return ChatMessageResponse.builder()
                .type(type)
                .room(m.getRoomId())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .role(m.getRole())
                .content(m.getContent())
                .imageUrl(m.getImageUrl())
                .timestamp(
                        m.getCreatedAt() != null
                                ? m.getCreatedAt().toString()
                                : OffsetDateTime.now().toString()
                )
                .build();
    }
}
