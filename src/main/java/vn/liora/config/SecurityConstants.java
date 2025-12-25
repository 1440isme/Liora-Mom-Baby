package vn.liora.config;

/**
 * Security Constants
 * Chứa các constants liên quan đến security configuration
 */
public final class SecurityConstants {

        private SecurityConstants() {
                // Utility class
        }

        // ===== PUBLIC ENDPOINTS =====
        public static final String[] AUTH_ENDPOINTS = {
                        "/auth/token",
                        "/auth/introspect",
                        "/auth/logout",
                        "/auth/refresh",
                        "/admin/login",
                        "/login"
        };

        public static final String[] USER_REGISTRATION_ENDPOINTS = {
                        "/users",
                        "/users/send-registration-otp",
                        "/users/verify-registration-otp",
                        "/users/register-with-otp",
                        "/users/send-password-reset-otp",
                        "/users/verify-password-reset-otp",
                        "/users/reset-password-with-otp"
        };

        public static final String[] OAUTH2_ENDPOINTS = {
                        "/oauth2/**",
                        "/login/oauth2/**",
                        "/authenticate",
                        "/auth/google/**"
        };

        public static final String[] PUBLIC_PAGES = {
                        "/",
                        "/home"
        };

        public static final String[] GUEST_ORDER_ENDPOINTS = {
                        "/user/order-detail/access",
                        "/user/order-detail/set-session",
                        "/user/order-detail-view",
                        "/user/order-lookup",
                        "/user/order-detail/*"
        };

        public static final String[] STATIC_RESOURCES = {
                        "/favicon.ico",
                        "/static/**",
                        "/css/**",
                        "/js/**",
                        "/images/**",
                        "/webjars/**"
        };

        public static final String[] ADMIN_STATIC_RESOURCES = {
                        "/admin/css/**",
                        "/admin/js/**",
                        "/admin/images/**",
                        "/admin/fonts/**",
                        "/admin/vendors/**"
        };

        public static final String[] UPLOAD_ENDPOINTS = {
                        "/uploads/**"
        };

        public static final String[] CART_API_ENDPOINTS = {
                        "/cart/api/**",
                        "/CartProduct/**"
        };

        // ===== JWT CONFIGURATION =====
        public static final String JWT_AUTHORITIES_CLAIM = "scope";
        public static final String JWT_AUTHORITY_PREFIX = "";
        public static final String ACCESS_TOKEN_COOKIE_NAME = "access_token";
        public static final String AUTHORIZATION_HEADER = "Authorization";

        // ===== CORS CONFIGURATION =====
        public static final String CORS_ALL_ORIGINS = "*";
        public static final String CORS_ALL_METHODS = "*";
        public static final String CORS_ALL_HEADERS = "*";
        public static final String CORS_PATH_PATTERN = "/**";

        // ===== PASSWORD ENCODER =====
        public static final int BCRYPT_STRENGTH = 10;

        // ===== OAUTH2 CONFIGURATION =====
        public static final String OAUTH2_LOGIN_PAGE = "/home";
        public static final String OAUTH2_SUCCESS_URL = "/authenticate";
}
