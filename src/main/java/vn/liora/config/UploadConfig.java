package vn.liora.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.liora.service.IDirectoryStructureService;

@Configuration
public class UploadConfig {

    @Autowired
    private IDirectoryStructureService directoryStructureService;

    @Bean
    public CommandLineRunner initUploadDirectories() {
        return args -> {
            try {
                String uploadPath = directoryStructureService.getUploadBasePath();
                directoryStructureService.createUploadDirectoryStructure(uploadPath);
                System.out.println("=== UPLOAD DIRECTORY INITIALIZATION COMPLETED ===");
            } catch (Exception e) {
                System.err.println("=== UPLOAD DIRECTORY INITIALIZATION FAILED ===");
                System.err.println("Error: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }
}
