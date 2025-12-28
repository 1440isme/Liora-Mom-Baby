package vn.liora.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChatHistoryResponse {

    private String type;   // HISTORY
    private String room;

    private List<ChatMessageResponse> messages;
}
