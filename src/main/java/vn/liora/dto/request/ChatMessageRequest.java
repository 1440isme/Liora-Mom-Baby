package vn.liora.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatMessageRequest {
    @Size(max = 2000, message = "Content tối đa 2000 ký tự")
    private String content;
    @Size(max = 500, message = "Image URL tối đa 500 ký tự")
    private String imageUrl;
}
