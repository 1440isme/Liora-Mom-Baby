package vn.liora.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.liora.config.GuestCartInterceptor;
import vn.liora.dto.RecentlyViewedDTO;
import vn.liora.service.RecentlyViewedService;
import vn.liora.repository.UserRepository;
import vn.liora.entity.User;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recently-viewed")
@RequiredArgsConstructor
@Slf4j
public class RecentlyViewedController {
    
    private final RecentlyViewedService recentlyViewedService;
    private final UserRepository userRepository;
    
    @PostMapping("/track")
    public ResponseEntity<Map<String, Object>> trackProductView(
            @RequestParam Long productId,
            @CookieValue(name = GuestCartInterceptor.GUEST_CART_ID_COOKIE_NAME, required = false) String guestId,
            HttpServletRequest request,
            HttpServletResponse response) {
        
        try {
            if (guestId == null) {
                guestId = java.util.UUID.randomUUID().toString();
                Cookie cookie = new Cookie(GuestCartInterceptor.GUEST_CART_ID_COOKIE_NAME, guestId);
                cookie.setPath("/");
                cookie.setMaxAge(30 * 24 * 60 * 60);
                response.addCookie(cookie);
            }
            
            // Lấy userId giống hệt CartController
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isGuest = (auth == null) || !auth.isAuthenticated() 
                || "anonymousUser".equals(String.valueOf(auth.getPrincipal()));
            
            Long userId = null;
            if (!isGuest) {
                String principalName = auth.getName();
                User user = userRepository.findByUsername(principalName)
                    .orElseGet(() -> {
                        if (principalName != null && principalName.contains("@")) {
                            return userRepository.findByEmail(principalName).orElse(null);
                        }
                        return null;
                    });
                if (user != null) {
                    userId = user.getUserId();
                }
            }
            
            RecentlyViewedDTO result = recentlyViewedService.trackProductView(productId, userId, guestId);
            
            Map<String, Object> responseMap = new HashMap<>();
            if (result != null) {
                responseMap.put("success", true);
                responseMap.put("data", result);
                return ResponseEntity.ok(responseMap);
            } else {
                responseMap.put("success", false);
                return ResponseEntity.badRequest().body(responseMap);
            }
        } catch (Exception e) {
            log.error("Error tracking product view", e);
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("success", false);
            responseMap.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(responseMap);
        }
    }
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getRecentlyViewed(
            @RequestParam(defaultValue = "10") int limit,
            @CookieValue(name = GuestCartInterceptor.GUEST_CART_ID_COOKIE_NAME, required = false) String guestId,
            HttpServletRequest request,
            HttpServletResponse response) {
        
        try {
            if (guestId == null) {
                Map<String, Object> responseMap = new HashMap<>();
                responseMap.put("success", true);
                responseMap.put("data", List.of());
                responseMap.put("count", 0);
                return ResponseEntity.ok(responseMap);
            }
            
            // Lấy userId giống hệt CartController
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isGuest = (auth == null) || !auth.isAuthenticated() 
                || "anonymousUser".equals(String.valueOf(auth.getPrincipal()));
            
            Long userId = null;
            if (!isGuest) {
                String principalName = auth.getName();
                User user = userRepository.findByUsername(principalName)
                    .orElseGet(() -> {
                        if (principalName != null && principalName.contains("@")) {
                            return userRepository.findByEmail(principalName).orElse(null);
                        }
                        return null;
                    });
                if (user != null) {
                    userId = user.getUserId();
                }
            }
            
            List<RecentlyViewedDTO> list = recentlyViewedService.getRecentlyViewed(userId, guestId, limit);
            
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("success", true);
            responseMap.put("data", list);
            responseMap.put("count", list.size());
            return ResponseEntity.ok(responseMap);
        } catch (Exception e) {
            log.error("Error getting recently viewed", e);
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("success", false);
            responseMap.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(responseMap);
        }
    }
    
}

