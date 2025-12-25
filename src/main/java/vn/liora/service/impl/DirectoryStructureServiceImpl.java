package vn.liora.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.liora.service.IDirectoryStructureService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class DirectoryStructureServiceImpl implements IDirectoryStructureService {

    @Value("${storage.location}")
    private String uploadBasePath;

    private static final String[] CATEGORIES = { "brands", "products", "categories", "users", "banners" };
    private static final String THUMBNAIL_SUBDIR = "thumbnails";
    private static final String AVATAR_SUBDIR = "avatars";

    @Override
    public void createUploadDirectoryStructure(String basePath) {
        try {
            Path baseDir = Paths.get(basePath);
            ensureDirectoryExists(baseDir);

            // Tạo thư mục cho từng category
            for (String category : CATEGORIES) {
                Path categoryDir = baseDir.resolve(category);
                ensureDirectoryExists(categoryDir);

                // Tạo thư mục con cho từng category
                if ("users".equals(category)) {
                    Path avatarDir = categoryDir.resolve(AVATAR_SUBDIR);
                    ensureDirectoryExists(avatarDir);
                } else if (!"banners".equals(category)) {
                    // Banners không cần thumbnails, chỉ cần folder gốc
                    Path thumbnailDir = categoryDir.resolve(THUMBNAIL_SUBDIR);
                    ensureDirectoryExists(thumbnailDir);
                }
            }

            // Tạo thư mục temp cho file tạm
            Path tempDir = baseDir.resolve("temp");
            ensureDirectoryExists(tempDir);

            // Tạo thư mục backup
            Path backupDir = baseDir.resolve("backup");
            ensureDirectoryExists(backupDir);

            System.out.println("Đã tạo cấu trúc thư mục upload thành công tại: " + basePath);

        } catch (Exception e) {
            System.err.println("Lỗi khi tạo cấu trúc thư mục: " + e.getMessage());
            throw new RuntimeException("Không thể tạo cấu trúc thư mục upload", e);
        }
    }

    @Override
    public String createDateBasedPath(String category) {
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        return category + "/" + datePath;
    }

    @Override
    public String createFullPath(String category, String filename, boolean isThumbnail) {
        String datePath = createDateBasedPath(category);

        if (isThumbnail) {
            if ("users".equals(category)) {
                return datePath + "/" + AVATAR_SUBDIR + "/" + filename;
            } else {
                return datePath + "/" + THUMBNAIL_SUBDIR + "/" + filename;
            }
        } else {
            if ("users".equals(category)) {
                return datePath + "/" + AVATAR_SUBDIR + "/" + filename;
            } else {
                return datePath + "/" + filename;
            }
        }
    }

    @Override
    public void ensureDirectoryExists(Path path) {
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
                System.out.println("Đã tạo thư mục: " + path.toString());
            }
        } catch (IOException e) {
            System.err.println("Lỗi khi tạo thư mục " + path + ": " + e.getMessage());
            throw new RuntimeException("Không thể tạo thư mục: " + path, e);
        }
    }

    @Override
    public String getUploadBasePath() {
        return uploadBasePath;
    }
}
