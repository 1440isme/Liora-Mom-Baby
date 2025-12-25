package vn.liora.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

        @Value("${storage.location}")
        private String storageLocation;

        @Override
        public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
                // Đảm bảo static resources được ưu tiên hơn controller mapping
                registry.setOrder(1);
                // Cấu hình cho favicon (specific nhất)
                registry.addResourceHandler("/favicon.ico")
                                .addResourceLocations("classpath:/static/admin/images/")
                                .setCachePeriod(3600);

                // User static resources (specific paths)
                registry.addResourceHandler("/user/css/**")
                                .addResourceLocations("classpath:/static/user/css/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/user/js/**")
                                .addResourceLocations("classpath:/static/user/js/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/user/images/**")
                                .addResourceLocations("classpath:/static/user/images/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/user/img/**")
                                .addResourceLocations("classpath:/static/user/img/")
                                .setCachePeriod(3600);

                // Admin static resources (specific paths)
                registry.addResourceHandler("/admin/css/**")
                                .addResourceLocations("classpath:/static/admin/css/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/admin/js/**")
                                .addResourceLocations("classpath:/static/admin/js/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/admin/images/**")
                                .addResourceLocations("classpath:/static/admin/images/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/admin/fonts/**")
                                .addResourceLocations("classpath:/static/admin/fonts/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/admin/vendors/**")
                                .addResourceLocations("classpath:/static/admin/vendors/")
                                .setCachePeriod(3600);

                // Upload files (specific path) with fallback
                registry.addResourceHandler("/uploads/**")
                                .addResourceLocations("file:" + storageLocation + "/")
                                .setCachePeriod(3600)
                                .resourceChain(true)
                                .addResolver(new org.springframework.web.servlet.resource.PathResourceResolver() {
                                        @Override
                                        protected org.springframework.core.io.Resource getResource(
                                                        @NonNull String resourcePath,
                                                        @NonNull org.springframework.core.io.Resource location)
                                                        throws java.io.IOException {
                                                org.springframework.core.io.Resource resource = location
                                                                .createRelative(resourcePath);
                                                if (resource.exists() && resource.isReadable()) {
                                                        return resource;
                                                }
                                                // Fallback to default image if file not found
                                                return new org.springframework.core.io.ClassPathResource(
                                                                "static/user/img/default-product.jpg");
                                        }
                                });

                // Generic static resources (đặt cuối cùng để tránh conflict)
                registry.addResourceHandler("/css/**")
                                .addResourceLocations("classpath:/static/css/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/js/**")
                                .addResourceLocations("classpath:/static/js/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/images/**")
                                .addResourceLocations("classpath:/static/images/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/fonts/**")
                                .addResourceLocations("classpath:/static/fonts/")
                                .setCachePeriod(3600);

                registry.addResourceHandler("/vendors/**")
                                .addResourceLocations("classpath:/static/vendors/")
                                .setCachePeriod(3600);

                // Static resources fallback
                registry.addResourceHandler("/static/**")
                                .addResourceLocations("classpath:/static/")
                                .setCachePeriod(3600);
        }
}