package vn.liora.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatMessageResponse {

    private String type;      // CHAT | JOIN | LEAVE
    private String room;

    private Long senderId;
    private String senderName;
    private String role;

    private String content;
    private String imageUrl;

    private String timestamp;
}
