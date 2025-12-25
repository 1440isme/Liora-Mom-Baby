package vn.liora.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private GuestCartInterceptor guestCartInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Áp dụng interceptor cho tất cả các request
        registry.addInterceptor(guestCartInterceptor);
    }
}