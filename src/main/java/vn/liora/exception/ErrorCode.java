package vn.liora.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public enum ErrorCode {
        UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),

        // Binh: 1001 - 1999
        INVALID_KEY(1001, "Khóa thông báo không hợp lệ", HttpStatus.BAD_REQUEST),
        USER_EXISTED(1002, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
        EMAIL_EXISTED(1010, "Email đã tồn tại", HttpStatus.BAD_REQUEST),
        USER_NOT_FOUND(1003, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
        USERNAME_INVALID(1004, "Tên đăng nhập phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
        PASSWORD_INVALID(1005, "Mật khẩu phải có ít nhất {min} ký tự", HttpStatus.BAD_REQUEST),
        ACCOUNT_LOCKED(1011, "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),
        USER_NOT_EXISTED(1006, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
        UNAUTHENTICATED(1007, "Chưa đăng nhập", HttpStatus.UNAUTHORIZED),
        UNAUTHORIZED(1008, "Bạn không có quyền truy cập", HttpStatus.FORBIDDEN),
        INVALID_DOB(1009, "Tuổi của bạn phải ít nhất {min} tuổi", HttpStatus.BAD_REQUEST),
        PASSWORD_NOT_MATCH(1012, "Mật khẩu xác nhận không khớp", HttpStatus.BAD_REQUEST),
        INVALID_TOKEN(1013, "Token không hợp lệ", HttpStatus.BAD_REQUEST),
        TOKEN_EXPIRED(1014, "Token đã hết hạn", HttpStatus.BAD_REQUEST),
        INVALID_PASSWORD(1015, "Mật khẩu hiện tại không đúng", HttpStatus.BAD_REQUEST),
        NEW_PASSWORD_SAME_AS_CURRENT(1016, "Mật khẩu mới phải khác mật khẩu hiện tại", HttpStatus.BAD_REQUEST),
        INVALID_OTP(1017, "Mã OTP không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
        OTP_LIMIT_EXCEEDED(1018, "Bạn đã gửi quá nhiều mã OTP trong ngày", HttpStatus.BAD_REQUEST),

        // Dai: 2000 - 2999
        BRAND_EXISTED(400, "Thương hiệu đã tồn tại", HttpStatus.BAD_REQUEST),
        BRAND_NOT_FOUND(404, "Không tìm thấy thương hiệu", HttpStatus.NOT_FOUND),
        BRAND_HAS_PRODUCTS(400, "Không thể xóa thương hiệu đã có sản phẩm", HttpStatus.BAD_REQUEST),

        // Category errors
        CATEGORY_NOT_FOUND(404, "Không tìm thấy danh mục", HttpStatus.NOT_FOUND),
        CATEGORY_EXISTED(400, "Danh mục đã tồn tại", HttpStatus.BAD_REQUEST),
        CATEGORY_PARENT_INACTIVE(400, "Không thể kích hoạt danh mục vì danh mục cha đang bị vô hiệu hóa",
                        HttpStatus.BAD_REQUEST),
        CATEGORY_CIRCULAR_REFERENCE(400, "Danh mục không thể là danh mục cha của chính nó", HttpStatus.BAD_REQUEST),
        CATEGORY_INVALID_PARENT_LOGIC(400, "Danh mục có danh mục cha không thể là danh mục cha",
                        HttpStatus.BAD_REQUEST),
        CATEGORY_HAS_PRODUCTS(400, "Không thể xóa danh mục đã có sản phẩm", HttpStatus.BAD_REQUEST),

        // Product errors
        PRODUCT_EXISTED(400, "Sản phẩm đã tồn tại", HttpStatus.BAD_REQUEST),
        PRODUCT_NOT_FOUND(404, "Không tìm thấy sản phẩm", HttpStatus.NOT_FOUND),
        PRODUCT_NAME_ALREADY_EXISTS(409, "Tên sản phẩm đã tồn tại", HttpStatus.CONFLICT),
        PRODUCT_HAS_ORDERS(400, "Không thể xóa sản phẩm đã được bán", HttpStatus.BAD_REQUEST),

        // Validation errors
        VALIDATION_NAME_TOO_LONG(400, "Tên không được vượt quá 255 ký tự", HttpStatus.BAD_REQUEST),
        VALIDATION_ICON_TOO_LONG(400, "Đường dẫn icon không được vượt quá 255 ký tự", HttpStatus.BAD_REQUEST),
        VALIDATION_REQUIRED_FIELD(400, "Trường này là bắt buộc", HttpStatus.BAD_REQUEST),

        // Product validation errors
        PRODUCT_NAME_REQUIRED(400, "Tên sản phẩm là bắt buộc", HttpStatus.BAD_REQUEST),
        PRODUCT_DESCRIPTION_REQUIRED(400, "Mô tả sản phẩm là bắt buộc", HttpStatus.BAD_REQUEST),
        PRODUCT_PRICE_REQUIRED(400, "Giá sản phẩm là bắt buộc", HttpStatus.BAD_REQUEST),
        PRODUCT_PRICE_INVALID(400, "Giá sản phẩm phải ít nhất 0.01", HttpStatus.BAD_REQUEST),
        PRODUCT_PRICE_TOO_HIGH(400, "Giá sản phẩm không được vượt quá 99,999,999.99", HttpStatus.BAD_REQUEST),
        PRODUCT_STOCK_INVALID(400, "Số lượng sản phẩm không thể âm", HttpStatus.BAD_REQUEST),
        PRODUCT_BRAND_REQUIRED(400, "Thương hiệu sản phẩm là bắt buộc", HttpStatus.BAD_REQUEST),
        PRODUCT_CATEGORY_REQUIRED(400, "Danh mục sản phẩm là bắt buộc", HttpStatus.BAD_REQUEST),
        PRODUCT_CATEGORY_INACTIVE(400, "Không thể kích hoạt sản phẩm vì danh mục đang tạm dừng hoạt động", HttpStatus.BAD_REQUEST),
        PRODUCT_BRAND_INACTIVE(400, "Không thể kích hoạt sản phẩm vì thương hiệu đang tạm dừng hoạt động", HttpStatus.BAD_REQUEST),
        PRODUCT_RATING_INVALID(400, "Đánh giá sản phẩm phải từ 0.0 đến 5.0", HttpStatus.BAD_REQUEST),
        PRODUCT_STOCK_TOO_HIGH(400, "Số lượng sản phẩm không được vượt quá 999,999", HttpStatus.BAD_REQUEST),
        PRODUCT_SOLD_COUNT_INVALID(400, "Số lượng đã bán không thể âm", HttpStatus.BAD_REQUEST),
        PRODUCT_SOLD_COUNT_TOO_HIGH(400, "Số lượng đã bán không được vượt quá 999,999", HttpStatus.BAD_REQUEST),

        // Image errors
        IMAGE_NOT_FOUND(404, "Không tìm thấy hình ảnh", HttpStatus.NOT_FOUND),
        INVALID_FILE_TYPE(400, "Loại file không hợp lệ", HttpStatus.BAD_REQUEST),
        TOO_MANY_IMAGES(400, "Quá nhiều hình ảnh cho sản phẩm này", HttpStatus.BAD_REQUEST),
        UPLOAD_FAILED(500, "Tải lên thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
        IMAGE_NOT_BELONG_TO_PRODUCT(400, "Hình ảnh không thuộc về sản phẩm này", HttpStatus.BAD_REQUEST),

        // Hanh: 3000 - 3999
        ADDRESS_NOT_FOUND(3000, "Không tìm thấy địa chỉ", HttpStatus.NOT_FOUND),
        CANNOT_DELETE_DEFAULT_ADDRESS(3001, "Không thể xóa địa chỉ mặc định khi còn địa chỉ khác",
                        HttpStatus.BAD_REQUEST),
        DEFAULT_ADDRESS_NOT_FOUND(3002, "Không tìm thấy địa chỉ mặc định", HttpStatus.NOT_FOUND),
        CART_NOT_FOUND(3003, "Không tìm thấy giỏ hàng", HttpStatus.NOT_FOUND),
        CART_PRODUCT_NOT_FOUND(3004, "Không tìm thấy sản phẩm trong giỏ hàng", HttpStatus.NOT_FOUND),
        ORDER_NOT_FOUND(3005, "Không tìm thấy đơn hàng", HttpStatus.NOT_FOUND),
        ORDER_PRODUCT_NOT_FOUND(3006, "Không tìm thấy sản phẩm trong đơn hàng", HttpStatus.NOT_FOUND),
        CART_ALREADY_EXISTS(3007, "Giỏ hàng đã tồn tại cho người dùng này", HttpStatus.BAD_REQUEST),
        INVALID_CART_QUANTITY(3008, "Số lượng giỏ hàng không hợp lệ", HttpStatus.BAD_REQUEST),
        INVALID_ORDER_STATUS(3009, "Trạng thái đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST),
        ORDER_CANNOT_BE_CANCELLED(3010, "Đơn hàng không thể hủy trong trạng thái hiện tại", HttpStatus.BAD_REQUEST),
        PRODUCT_OUT_OF_STOCK(3011, "Sản phẩm đã hết hàng", HttpStatus.BAD_REQUEST),
        INSUFFICIENT_STOCK(3012, "Số lượng sản phẩm không đủ", HttpStatus.BAD_REQUEST),
        VALIDATION_PHONE_INVALID_LENGTH(3013, "Số điện thoại phải có đúng 10 chữ số", HttpStatus.BAD_REQUEST),
        VALIDATION_QUANTITY_MIN_ONE(3014, "Số lượng phải ít nhất là 1", HttpStatus.BAD_REQUEST),
        NO_SELECTED_PRODUCT(400, "Không có sản phẩm nào được chọn", HttpStatus.BAD_REQUEST),
        NO_VALID_PRODUCT(400, "Không có sản phẩm hợp lệ để đặt hàng (sản phẩm phải available, isActive và có đủ stock)", HttpStatus.BAD_REQUEST),
        CANNOT_REMOVE_DEFAULT_ADDRESS(400, "Không thể xóa địa chỉ mặc định", HttpStatus.BAD_REQUEST),

        // Khoi: 4000 - 4999 (Review & Discount)
        REVIEW_NOT_FOUND(400, "Không tìm thấy đánh giá", HttpStatus.NOT_FOUND),
        REVIEW_NOT_ALLOWED(401, "Người dùng không được phép đánh giá sản phẩm này", HttpStatus.BAD_REQUEST),
        REVIEW_ALREADY_EXISTS(402, "Đánh giá đã tồn tại cho sản phẩm trong đơn hàng này", HttpStatus.BAD_REQUEST),
        REVIEW_ACCESS_DENIED(403, "Truy cập bị từ chối cho đánh giá này", HttpStatus.FORBIDDEN),
        ORDER_NOT_PAID(404, "Đơn hàng chưa được thanh toán", HttpStatus.BAD_REQUEST),
        ORDER_INVALID(405, "Đơn hàng không hợp lệ hoặc đã bị hủy", HttpStatus.BAD_REQUEST),
        DISCOUNT_NOT_FOUND(406, "Không tìm thấy mã giảm giá", HttpStatus.NOT_FOUND),
        DISCOUNT_NAME_ALREADY_EXISTS(407, "Tên mã giảm giá đã tồn tại", HttpStatus.BAD_REQUEST),
        INVALID_DATE_RANGE(408, "Khoảng thời gian không hợp lệ", HttpStatus.BAD_REQUEST),
        DISCOUNT_CANNOT_BE_APPLIED(409, "Mã giảm giá không thể áp dụng", HttpStatus.BAD_REQUEST),
        VALIDATION_DISCOUNT_TYPE_TOO_LONG(410, "Loại mã giảm giá không được vượt quá 50 ký tự", HttpStatus.BAD_REQUEST),
        DISCOUNT_NOT_APPLIED_TO_ORDER(411, "Mã giảm giá không được áp dụng cho đơn hàng này", HttpStatus.BAD_REQUEST),
        INTERNAL_SERVER_ERROR(412, "Lỗi máy chủ nội bộ", HttpStatus.INTERNAL_SERVER_ERROR),
        ORDER_NOT_DELIVERED(413, "Đơn hàng chưa được giao", HttpStatus.BAD_REQUEST),
        VALIDATION_DESCRIPTION_TOO_LONG(400, "Mô tả không được vượt quá 500 ký tự", HttpStatus.BAD_REQUEST),
        VALIDATION_DISCOUNT_VALUE_POSITIVE(400, "Giá trị giảm giá phải là số dương", HttpStatus.BAD_REQUEST),
        VALIDATION_MIN_ORDER_VALUE_POSITIVE(400, "Giá trị đơn hàng tối thiểu phải là số dương", HttpStatus.BAD_REQUEST),
        VALIDATION_MAX_DISCOUNT_AMOUNT_POSITIVE(400, "Số tiền giảm giá tối đa phải là số dương",
                        HttpStatus.BAD_REQUEST),
        VALIDATION_USAGE_LIMIT_NON_NEGATIVE(400, "Giới hạn sử dụng phải không âm", HttpStatus.BAD_REQUEST),
        VALIDATION_USER_USAGE_LIMIT_NON_NEGATIVE(400, "Giới hạn sử dụng của người dùng phải không âm",
                        HttpStatus.BAD_REQUEST),
        DISCOUNT_REQUIRES_LOGIN(400, "Chỉ dùng mã giảm giá khi đã đăng nhập", HttpStatus.BAD_REQUEST),

        // Payment errors
        PAYMENT_CREATION_FAILED(5000, "Không thể tạo thanh toán", HttpStatus.INTERNAL_SERVER_ERROR),
        ;

        private int code;
        private String message;
        private HttpStatusCode statusCode;

}