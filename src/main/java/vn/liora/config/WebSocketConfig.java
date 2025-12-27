package vn.liora.config;

import vn.liora.websocket.handler.ChatWebSocketHandler;
import vn.liora.websocket.interceptor.JwtHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@EnableWebSocket
@RequiredArgsConstructor
@Configuration(proxyBeanMethods = false)
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/ws/chat/{room}")
            .addInterceptors(jwtHandshakeInterceptor)
            .setAllowedOrigins("*");
    }
}
