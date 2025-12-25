package vn.liora.dto.response;

import lombok.Data;

@Data
public class GhnApiResponse<T> {
    private Integer code;
    private String message;
    private T data;
}
