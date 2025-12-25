package vn.liora.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Security Configuration
 * Cấu hình bảo mật cho ứng dụng Liora
 * - JWT Authentication
 * - OAuth2 Google Login
 * - Role-based Authorization
 * - CORS Configuration
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final CustomJwtDecoder customJwtDecoder;
        private final OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService;
        private final CustomAccessDeniedHandler customAccessDeniedHandler;
        private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

        /**
         * Tổng hợp tất cả public endpoints
         */
        private String[] getAllPublicEndpoints() {
                return new String[] {
                                // Authentication endpoints
                                "/auth/token", "/auth/introspect", "/auth/logout", "/auth/refresh",
                                "/auth/force-refresh",
                                "/admin/login", "/login",
                                // OAuth2 endpoints
                                "/oauth2/**", "/login/oauth2/**", "/authenticate", "/auth/google/**",
                                // Public user pages
                                "/", "/home",
                                // User order lookup (for guests)
                                "/user/order-detail/access", "/user/order-detail/set-session",
                                "/user/order-detail-view", "/user/order-lookup", "/user/order-detail/*",
                                // Public product pages (for guests)
                                "/product/**", "/brand/**",
                                // Public content pages (for guests)
                                "/content/**",
                                // Public cart pages (for guests)
                                "/cart", "/checkout",
                                // Public search and payment pages (for guests)
                                "/search-results", "/payment/**",
                                // Static resources (specific paths first)
                                "/favicon.ico", "/static/**",
                                // User static resources
                                "/user/css/**", "/user/js/**", "/user/images/**", "/user/img/**",
                                // Admin static resources
                                "/admin/css/**", "/admin/js/**", "/admin/images/**", "/admin/fonts/**",
                                "/admin/vendors/**",
                                // Generic static resources
                                "/css/**", "/js/**", "/images/**", "/fonts/**", "/vendors/**", "/webjars/**",
                                // Upload endpoints (for file uploads)
                                "/uploads/**",
                                // User registration endpoints (for public access)
                                "/users", "/users/send-registration-otp", "/users/verify-registration-otp",
                                "/users/register-with-otp", "/users/send-password-reset-otp",
                                "/users/verify-password-reset-otp", "/users/reset-password-with-otp",
                                // Cart API endpoints (for guests and users)
                                "/cart/api/**", "/CartProduct/**",
                                // Recently Viewed API endpoints (for guests and users)
                                "/api/recently-viewed/**",
                                // Order API endpoints (for guests and users)
                                "/order/**",
                                // Content API endpoints (for public content)
                                "/content/api/footer", "/content/api/header-bottom", "/api/home", "/api/header/**",
                                // Product API endpoints (for public access)
                                "/api/products/best-selling", "/api/products/newest", "/api/products/**",
                                // Review API endpoints (for public access)
                                "/api/reviews/product/**", "/api/reviews/products/statistics",
                                // GHN API endpoints (for checkout and shipping)
                                "/api/ghn/**",
                                // Chatbot API endpoints (for public access)
                                "/api/chatbot/**",
                                // Admin API endpoints for public content
                                "/admin/banners/api/active",
                                // Discount API endpoints (for public access)
                                "/discounts/**",
                                // Debug endpoints (for troubleshooting)
                                "/debug/**"
                };
        }

        /**
         * Cấu hình Security Filter Chain
         * - Public endpoints không cần authentication
         * - Protected endpoints yêu cầu authentication
         * - OAuth2 login với Google
         * - JWT Resource Server
         */
        @Bean
        public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
                return httpSecurity
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(getAllPublicEndpoints()).permitAll()
                                                .requestMatchers("/info").authenticated()
                                                .requestMatchers("/users/myInfo").authenticated()
                                                .requestMatchers("/users/uploadAvatar").authenticated()

                                                .requestMatchers("/admin/**").authenticated()
                                                .requestMatchers("/admin/api/**").authenticated()
                                                .anyRequest().authenticated())
                                .oauth2Login(oauth2 -> oauth2
                                                .loginPage(SecurityConstants.OAUTH2_LOGIN_PAGE)
                                                .defaultSuccessUrl(SecurityConstants.OAUTH2_SUCCESS_URL, true)
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService)))
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .bearerTokenResolver(bearerTokenResolver())
                                                .jwt(jwtConfigurer -> jwtConfigurer
                                                                .decoder(customJwtDecoder)
                                                                .jwtAuthenticationConverter(
                                                                                jwtAuthenticationConverter()))
                                                // Cho phép OAuth2 Resource Server xử lý ngay cả khi endpoint là permitAll
                                                // để có thể đọc JWT token từ cookie và set authentication
                                                .authenticationEntryPoint(customAuthenticationEntryPoint)
                                                .accessDeniedHandler(customAccessDeniedHandler))
                                // Đảm bảo OAuth2 Resource Server filter chạy trước khi check authorization
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(customAuthenticationEntryPoint)
                                                .accessDeniedHandler(customAccessDeniedHandler))
                                .csrf(AbstractHttpConfigurer::disable)
                                .build();
        }

        /**
         * Cấu hình CORS Filter
         * Cho phép tất cả origins, methods và headers
         * TODO: Trong production nên hạn chế origins cụ thể
         */
        @Bean
        public CorsFilter corsFilter() {
                CorsConfiguration corsConfiguration = new CorsConfiguration();
                corsConfiguration.addAllowedOrigin(SecurityConstants.CORS_ALL_ORIGINS);
                corsConfiguration.addAllowedMethod(SecurityConstants.CORS_ALL_METHODS);
                corsConfiguration.addAllowedHeader(SecurityConstants.CORS_ALL_HEADERS);

                UrlBasedCorsConfigurationSource urlBasedCorsConfigurationSource = new UrlBasedCorsConfigurationSource();
                urlBasedCorsConfigurationSource.registerCorsConfiguration(SecurityConstants.CORS_PATH_PATTERN,
                                corsConfiguration);
                return new CorsFilter(urlBasedCorsConfigurationSource);
        }

        /**
         * Cấu hình JWT Authentication Converter
         * Chuyển đổi JWT claims thành Spring Security authorities
         */
        @Bean
        JwtAuthenticationConverter jwtAuthenticationConverter() {
                JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
                jwtGrantedAuthoritiesConverter.setAuthorityPrefix(SecurityConstants.JWT_AUTHORITY_PREFIX);
                jwtGrantedAuthoritiesConverter.setAuthoritiesClaimName(SecurityConstants.JWT_AUTHORITIES_CLAIM);

                JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
                jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);

                return jwtAuthenticationConverter;
        }

        /**
         * Cấu hình Password Encoder
         * Sử dụng BCrypt với strength = 10
         */
        @Bean
        PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(SecurityConstants.BCRYPT_STRENGTH);
        }

        /**
         * Cấu hình Bearer Token Resolver
         * Hỗ trợ cả Authorization header và access_token cookie
         */
        @Bean
        public BearerTokenResolver bearerTokenResolver() {
                DefaultBearerTokenResolver defaultResolver = new DefaultBearerTokenResolver();
                defaultResolver.setBearerTokenHeaderName(SecurityConstants.AUTHORIZATION_HEADER);

                return new BearerTokenResolver() {
                        @Override
                        public String resolve(HttpServletRequest request) {
                                // 1) Try Authorization header first
                                String token = defaultResolver.resolve(request);
                                if (token != null) {
                                        return token;
                                }

                                // 2) Try access_token cookie
                                Cookie[] cookies = request.getCookies();
                                if (cookies != null) {
                                        for (Cookie cookie : cookies) {
                                                if (SecurityConstants.ACCESS_TOKEN_COOKIE_NAME
                                                                .equals(cookie.getName())) {
                                                        return cookie.getValue();
                                                }
                                        }
                                }
                                return null;
                        }
                };
        }
}
