package vn.liora.controller.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.UserCreationRequest;
import vn.liora.dto.request.UserUpdateRequest;
import vn.liora.dto.request.ChangePasswordRequest;
import vn.liora.dto.request.SendOtpRequest;
import vn.liora.dto.request.VerifyOtpRequest;
import vn.liora.dto.request.RegistrationWithOtpRequest;
import vn.liora.dto.request.ResetPasswordWithOtpRequest;
import vn.liora.dto.response.UserResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.PaginatedResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.mapper.UserMapper;
import vn.liora.service.IOrderService;
import vn.liora.service.IUserService;
import vn.liora.service.IAuthenticationService;
import vn.liora.service.IDirectoryStructureService;
import vn.liora.service.IStorageService;
import vn.liora.service.IImageOptimizationService;
import vn.liora.service.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.nimbusds.jose.JOSEException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final IOrderService orderService;
    private final IUserService userService;
    private final IAuthenticationService authenticationService;
    private final IDirectoryStructureService directoryStructureService;
    private final IStorageService storageService;
    private final IImageOptimizationService imageOptimizationService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // Lưu trữ OTP tạm thời trong memory (có thể thay bằng Redis trong production)
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    // Class để lưu trữ OTP data
    private static class OtpData {
        String otpCode;
        long expiryTime;
        String type;

        OtpData(String otpCode, long expiryTime, String type) {
            this.otpCode = otpCode;
            this.expiryTime = expiryTime;
            this.type = type;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }

    @GetMapping("/myInfo")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            User user = findUserByPrincipal(authentication);

            if (user == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            UserResponse userResponse = userMapper.toUserResponse(user);

            ApiResponse<UserResponse> response = new ApiResponse<>();
            response.setResult(userResponse);
            response.setMessage("Lấy thông tin người dùng thành công");

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @PutMapping("/myInfo")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyInfo(@Valid @RequestBody UserUpdateRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            User currentUser = findUserByPrincipal(authentication);
            if (currentUser == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            // Cập nhật thông tin user
            UserResponse updatedUser = userService.updateUser(currentUser.getUserId(), request);

            ApiResponse<UserResponse> response = new ApiResponse<>();
            response.setResult(updatedUser);
            response.setMessage("Cập nhật thông tin thành công");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @GetMapping("/myOrders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            User user = findUserByPrincipal(authentication);

            if (user == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            List<OrderResponse> orders = orderService.getMyOrders(user.getUserId());

            ApiResponse<List<OrderResponse>> response = new ApiResponse<>();
            response.setResult(orders);
            response.setMessage("Lấy lịch sử đơn hàng thành công");

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @GetMapping("/myOrdersWithProducts")
    public ResponseEntity<ApiResponse<PaginatedResponse<Object>>> getMyOrdersWithProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            User user = findUserByPrincipal(authentication);

            if (user == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            List<OrderResponse> orders = orderService.getMyOrdersPaginated(user.getUserId(), page, size);

            // Tạo response với thông tin sản phẩm đầu tiên
            List<Object> ordersWithProducts = orders.stream().map(order -> {
                try {
                    List<OrderProductResponse> products = orderService.getProductsByOrderId(order.getIdOrder());
                    OrderProductResponse firstProduct = products.isEmpty() ? null : products.get(0);

                    class OrderWithProduct {
                        @SuppressWarnings("unused")
                        public final OrderResponse order;
                        @SuppressWarnings("unused")
                        public final OrderProductResponse firstProduct;
                        @SuppressWarnings("unused")
                        public final Integer totalProducts;

                        public OrderWithProduct(OrderResponse order, OrderProductResponse firstProduct,
                                Integer totalProducts) {
                            this.order = order;
                            this.firstProduct = firstProduct;
                            this.totalProducts = totalProducts;
                        }
                    }

                    return new OrderWithProduct(order, firstProduct, products.size());
                } catch (Exception e) {
                    // Nếu không lấy được sản phẩm, trả về order không có sản phẩm
                    class OrderWithProduct {
                        @SuppressWarnings("unused")
                        public final OrderResponse order;
                        @SuppressWarnings("unused")
                        public final OrderProductResponse firstProduct = null;
                        @SuppressWarnings("unused")
                        public final Integer totalProducts = 0;

                        public OrderWithProduct(OrderResponse order, OrderProductResponse firstProduct,
                                Integer totalProducts) {
                            this.order = order;
                        }
                    }
                    return new OrderWithProduct(order, null, 0);
                }
            }).collect(java.util.stream.Collectors.toList());

            // Tính toán thông tin phân trang
            long totalElements = orderService.countMyOrders(user.getUserId());
            int totalPages = (int) Math.ceil((double) totalElements / size);

            PaginatedResponse<Object> paginatedResponse = PaginatedResponse.<Object>builder()
                    .content(ordersWithProducts)
                    .currentPage(page)
                    .pageSize(size)
                    .totalElements(totalElements)
                    .totalPages(totalPages)
                    .hasNext(page < totalPages - 1)
                    .hasPrevious(page > 0)
                    .isFirst(page == 0)
                    .isLast(page >= totalPages - 1)
                    .build();

            ApiResponse<PaginatedResponse<Object>> response = new ApiResponse<>();
            response.setResult(paginatedResponse);
            response.setMessage("Lấy lịch sử đơn hàng với sản phẩm thành công");

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @GetMapping("/orderStats")
    public ResponseEntity<ApiResponse<Object>> getOrderStats() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            User user = findUserByPrincipal(authentication);

            if (user == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            Long totalOrders = orderService.countByUser(user);
            BigDecimal totalSpent = orderService.getTotalRevenueByUserCompleted(user);

            // Create stats object
            class OrderStats {
                @SuppressWarnings("unused")
                public final Long totalOrders;
                @SuppressWarnings("unused")
                public final BigDecimal totalSpent;

                public OrderStats(Long totalOrders, BigDecimal totalSpent) {
                    this.totalOrders = totalOrders;
                    this.totalSpent = totalSpent;
                }
            }

            OrderStats stats = new OrderStats(totalOrders, totalSpent);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setResult(stats);
            response.setMessage("Lấy thống kê đơn hàng thành công");

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Tìm user từ authentication, hỗ trợ cả JWT và OAuth2
     */
    private User findUserByPrincipal(Authentication authentication) {
        String principalName = authentication.getName();

        // 1. Thử tìm bằng username trước
        User user = userRepository.findByUsername(principalName).orElse(null);
        if (user != null) {
            return user;
        }

        // 2. Thử tìm bằng email nếu principal name chứa @
        if (principalName != null && principalName.contains("@")) {
            user = userRepository.findByEmail(principalName).orElse(null);
            if (user != null) {
                return user;
            }
        }

        // 3. Nếu là OAuth2 user, lấy user từ CustomOAuth2User
        if (authentication.getPrincipal() instanceof vn.liora.dto.CustomOAuth2User) {
            vn.liora.dto.CustomOAuth2User customOAuth2User = (vn.liora.dto.CustomOAuth2User) authentication
                    .getPrincipal();
            return customOAuth2User.getUser();
        }

        return null;
    }

    @PutMapping("/changePassword")
    public ResponseEntity<ApiResponse<Object>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            User currentUser = findUserByPrincipal(authentication);
            if (currentUser == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            // Change password
            userService.changePassword(currentUser.getUserId(), request);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setMessage("Đổi mật khẩu thành công");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @DeleteMapping("/deactivateAccount")
    public ResponseEntity<ApiResponse<Object>> deactivateAccount() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            User currentUser = findUserByPrincipal(authentication);
            if (currentUser == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            // Deactivate account
            userService.deactivateAccount(currentUser.getUserId());

            ApiResponse<Object> response = new ApiResponse<>();
            response.setMessage("Tài khoản đã được vô hiệu hóa thành công");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Upload avatar cho user
     */
    @PostMapping(value = "/uploadAvatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            User currentUser = findUserByPrincipal(authentication);
            if (currentUser == null) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            // Validate file
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Vui lòng chọn file ảnh"));
            }

            if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File phải là ảnh"));
            }

            if (file.getSize() > 5 * 1024 * 1024) { // 5MB
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Kích thước file không được vượt quá 5MB"));
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = System.currentTimeMillis() + "_" + currentUser.getUserId() + extension;

            // Create path
            String relativePath = directoryStructureService.createFullPath("users", filename, false);
            Path mainImagePath = Paths.get(storageService.getStorageLocation(), relativePath);

            // Optimize image
            imageOptimizationService.optimizeImage(file, mainImagePath, 400, 400, 0.9f);

            // Update user avatar in database
            String avatarUrl = "/uploads/" + relativePath;
            currentUser.setAvatar(avatarUrl);
            userRepository.save(currentUser);

            Map<String, String> result = new HashMap<>();
            result.put("avatarUrl", avatarUrl);
            result.put("filename", filename);

            ApiResponse<Map<String, String>> response = new ApiResponse<>();
            response.setResult(result);
            response.setMessage("Upload avatar thành công");
            response.setCode(1000);

            return ResponseEntity.ok(response);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi upload avatar: " + e.getMessage()));
        }
    }

    /**
     * API test đơn giản
     */
    @GetMapping("/test")
    public ResponseEntity<ApiResponse<Object>> test() {
        ApiResponse<Object> response = new ApiResponse<>();
        response.setMessage("API test thành công");
        response.setCode(1000);
        return ResponseEntity.ok(response);
    }

    /**
     * API gửi OTP cho đăng ký
     */
    @PostMapping("/send-registration-otp")
    public ResponseEntity<ApiResponse<Object>> sendRegistrationOtp(@Valid @RequestBody SendOtpRequest request) {
        try {
            // Kiểm tra email đã tồn tại chưa
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            }

            // Tạo OTP code
            String otpCode = emailService.generateOtpCode();

            // Lưu OTP vào storage (10 phút)
            long expiryTime = System.currentTimeMillis() + (10 * 60 * 1000);
            otpStorage.put(request.getEmail(), new OtpData(otpCode, expiryTime, "REGISTRATION"));

            // Gửi email OTP
            emailService.sendRegistrationOtpEmail(request.getEmail(), otpCode);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setMessage("Mã OTP đã được gửi đến email của bạn");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * API xác thực OTP cho đăng ký
     */
    @PostMapping("/verify-registration-otp")
    public ResponseEntity<ApiResponse<Object>> verifyRegistrationOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            OtpData otpData = otpStorage.get(request.getEmail());

            if (otpData == null || otpData.isExpired() || !otpData.type.equals("REGISTRATION")) {
                throw new AppException(ErrorCode.INVALID_OTP);
            }

            if (!otpData.otpCode.equals(request.getOtpCode())) {
                throw new AppException(ErrorCode.INVALID_OTP);
            }

            // Xóa OTP sau khi xác thực thành công
            otpStorage.remove(request.getEmail());

            ApiResponse<Object> response = new ApiResponse<>();
            response.setMessage("Xác thực OTP thành công");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * API đăng ký với OTP
     */
    @PostMapping("/register-with-otp")
    public ResponseEntity<ApiResponse<Object>> registerWithOtp(@Valid @RequestBody RegistrationWithOtpRequest request) {
        try {
            // Xác thực OTP trước
            OtpData otpData = otpStorage.get(request.getEmail());

            if (otpData == null || otpData.isExpired() || !otpData.type.equals("REGISTRATION")) {
                throw new AppException(ErrorCode.INVALID_OTP);
            }

            if (!otpData.otpCode.equals(request.getOtpCode())) {
                throw new AppException(ErrorCode.INVALID_OTP);
            }

            // Xóa OTP sau khi xác thực thành công
            otpStorage.remove(request.getEmail());

            // Tạo UserCreationRequest từ RegistrationWithOtpRequest
            UserCreationRequest userCreationRequest = UserCreationRequest.builder()
                    .username(request.getUsername())
                    .password(request.getPassword())
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .firstname(request.getFirstname())
                    .lastname(request.getLastname())
                    .dob(request.getDob())
                    .gender(request.getGender())
                    .avatar(request.getAvatar())
                    .active(request.getActive())
                    .createdDate(request.getCreatedDate())
                    .role(request.getRole())
                    .build();

            // Tạo user mới
            UserResponse userResponse = userService.createUser(userCreationRequest);

            // Tạo JWT token cho user vừa đăng ký
            User user = userRepository.findByUsername(userResponse.getUsername())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            String token;
            try {
                token = authenticationService.generateTokenForOAuth2User(user);
            } catch (JOSEException e) {
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }

            // Tạo response chứa cả user info và token
            class RegistrationResponse {
                @SuppressWarnings("unused")
                public final UserResponse user;
                @SuppressWarnings("unused")
                public final String token;
                @SuppressWarnings("unused")
                public final String tokenType = "Bearer";

                public RegistrationResponse(UserResponse user, String token) {
                    this.user = user;
                    this.token = token;
                }
            }

            RegistrationResponse registrationResponse = new RegistrationResponse(userResponse, token);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setResult(registrationResponse);
            response.setMessage("Đăng ký tài khoản thành công");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * API gửi OTP cho reset password
     */
    @PostMapping("/send-password-reset-otp")
    public ResponseEntity<ApiResponse<Object>> sendPasswordResetOtp(@Valid @RequestBody SendOtpRequest request) {
        try {
            // Kiểm tra email có tồn tại không
            if (!userRepository.existsByEmail(request.getEmail())) {
                throw new AppException(ErrorCode.USER_NOT_FOUND);
            }

            // Tạo OTP code
            String otpCode = emailService.generateOtpCode();

            // Lưu OTP vào storage (10 phút)
            long expiryTime = System.currentTimeMillis() + (10 * 60 * 1000);
            otpStorage.put(request.getEmail(), new OtpData(otpCode, expiryTime, "PASSWORD_RESET"));

            // Gửi email OTP
            emailService.sendPasswordResetOtpEmail(request.getEmail(), otpCode);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setMessage("Mã OTP đã được gửi đến email của bạn");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * API xác thực OTP cho reset password
     */
    @PostMapping("/verify-password-reset-otp")
    public ResponseEntity<ApiResponse<Object>> verifyPasswordResetOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            OtpData otpData = otpStorage.get(request.getEmail());

            if (otpData == null || otpData.isExpired() || !otpData.type.equals("PASSWORD_RESET")) {
                throw new AppException(ErrorCode.INVALID_OTP);
            }

            if (!otpData.otpCode.equals(request.getOtpCode())) {
                throw new AppException(ErrorCode.INVALID_OTP);
            }

            // Xóa OTP sau khi xác thực thành công
            otpStorage.remove(request.getEmail());

            ApiResponse<Object> response = new ApiResponse<>();
            response.setMessage("Xác thực OTP thành công");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * API reset password với OTP
     */
    @PostMapping("/reset-password-with-otp")
    public ResponseEntity<ApiResponse<Object>> resetPasswordWithOtp(
            @Valid @RequestBody ResetPasswordWithOtpRequest request) {
        try {
            // Kiểm tra mật khẩu xác nhận
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
            }

            // Tìm user
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            // Cập nhật mật khẩu
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setMessage("Đặt lại mật khẩu thành công");
            response.setCode(1000);

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}