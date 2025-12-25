package vn.liora;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import vn.liora.config.StorageProperties;
import vn.liora.service.IStorageService;

@SpringBootApplication
@EnableConfigurationProperties({ StorageProperties.class })
public class LioraApplication {

    public static void main(String[] args) {
        SpringApplication.run(LioraApplication.class, args);
    }

    @Bean
    CommandLineRunner init(IStorageService storageService) {
        return (args) -> {
            storageService.init();
        };
    }
}
