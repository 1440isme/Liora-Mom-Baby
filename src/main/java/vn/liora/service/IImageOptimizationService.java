package vn.liora.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;

public interface IImageOptimizationService {
    /**
     * Tối ưu hóa và nén ảnh
     * 
     * @param file       file ảnh gốc
     * @param outputPath đường dẫn lưu file đã tối ưu
     * @param maxWidth   chiều rộng tối đa
     * @param maxHeight  chiều cao tối đa
     * @param quality    chất lượng (0.0 - 1.0)
     * @return đường dẫn file đã tối ưu
     */
    String optimizeImage(MultipartFile file, Path outputPath, int maxWidth, int maxHeight, float quality)
            throws IOException;

    /**
     * Tạo thumbnail cho ảnh
     * 
     * @param file          file ảnh gốc
     * @param outputPath    đường dẫn lưu thumbnail
     * @param thumbnailSize kích thước thumbnail
     * @return đường dẫn thumbnail
     */
    String createThumbnail(MultipartFile file, Path outputPath, int thumbnailSize) throws IOException;

    /**
     * Kiểm tra file có phải là ảnh hợp lệ không
     * 
     * @param file file cần kiểm tra
     * @return true nếu là ảnh hợp lệ
     */
    boolean isValidImageFile(MultipartFile file);

    /**
     * Lấy kích thước file sau khi tối ưu
     * 
     * @param file file gốc
     * @return kích thước file (bytes)
     */
    long getOptimizedFileSize(MultipartFile file, int maxWidth, int maxHeight, float quality) throws IOException;
}
