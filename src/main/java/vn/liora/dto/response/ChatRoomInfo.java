package vn.liora.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomInfo {
    private String roomId;
    private Long userId;
    private String username;
    private String fullName; // firstname + lastname
    private String displayName; // username hoặc fullName nếu có
    private String avatar; // avatar URL
}

