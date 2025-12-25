package vn.liora.service;

import java.nio.file.Path;

public interface IDirectoryStructureService {
    /**
     * Tạo cấu trúc thư mục cho upload
     * 
     * @param basePath đường dẫn gốc
     */
    void createUploadDirectoryStructure(String basePath);

    /**
     * Tạo đường dẫn thư mục theo ngày
     * 
     * @param category loại file (brands, products, categories, users)
     * @return đường dẫn thư mục
     */
    String createDateBasedPath(String category);

    /**
     * Tạo đường dẫn đầy đủ cho file
     * 
     * @param category    loại file
     * @param filename    tên file
     * @param isThumbnail có phải thumbnail không
     * @return đường dẫn đầy đủ
     */
    String createFullPath(String category, String filename, boolean isThumbnail);

    /**
     * Tạo thư mục nếu chưa tồn tại
     * 
     * @param path đường dẫn thư mục
     */
    void ensureDirectoryExists(Path path);

    /**
     * Lấy đường dẫn gốc upload
     * 
     * @return đường dẫn gốc
     */
    String getUploadBasePath();
}
