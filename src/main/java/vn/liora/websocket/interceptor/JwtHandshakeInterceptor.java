package vn.liora.websocket.interceptor;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import vn.liora.entity.User;
import vn.liora.service.IUserService;

import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    @Autowired
    private JwtDecoder jwtDecoder;
    @Autowired
    private IUserService userService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        try {
            // Thử 1: JWT Token từ query parameter
            var uri = request.getURI();
            var query = uri.getQuery();
            if (query != null && query.contains("token=")) {
                String token = null;
                for (String param : query.split("&")) {
                    if (param.startsWith("token=")) {
                        token = param.substring(6);
                        break;
                    }
                }
                if (token != null) {
                    try {
                        Jwt jwt = jwtDecoder.decode(token);
                        String username = jwt.getClaimAsString("sub");
                        if (username != null) {
                            User user = userService.findByUsernameFetchRoles(username).orElse(null);
                            if (user != null) {
                                // Ép load roles để tránh LazyInitializationException
                                if (user.getRoles() != null) user.getRoles().size();
                                attributes.put("currentUser", user);
                                System.out.println("[WS] User authenticated via JWT token: " + username);
                                return true;
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("[WS] JWT decode error: " + e.getMessage());
                    }
                }
            }
            
            // Thử 2: Session-based authentication (cho admin)
            if (request instanceof ServletServerHttpRequest servletRequest) {
                HttpSession session = servletRequest.getServletRequest().getSession(false);
                if (session != null) {
                    // Lấy user từ session attribute hoặc SecurityContext
                    User user = (User) session.getAttribute("currentUser");
                    if (user == null) {
                        // Thử lấy từ SecurityContext
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                            String username = auth.getName();
                            user = userService.findByUsernameFetchRoles(username).orElse(null);
                        }
                    }
                    if (user != null) {
                        // Ép load roles để tránh LazyInitializationException
                        if (user.getRoles() != null) user.getRoles().size();
                        attributes.put("currentUser", user);
                        System.out.println("[WS] User authenticated via session: " + user.getUsername());
                        return true;
                    }
                }
            }
            
            System.err.println("[WS] No valid authentication found");
            return false;
        } catch (Exception e) {
            System.err.println("[WS] JwtHandshakeInterceptor error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
    }
}
