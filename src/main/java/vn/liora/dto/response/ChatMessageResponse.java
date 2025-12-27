package vn.liora.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatMessageResponse {

    private String type;      // CHAT | JOIN | LEAVE
    private String room;

    private Long id;          // Message ID từ database
    private Long senderId;
    private String senderName;
    private String role;

    private String content;
    private String imageUrl;
    private String avatar;  // Avatar URL của sender

    private String timestamp;
}
