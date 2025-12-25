package vn.liora.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.liora.service.IImageOptimizationService;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;

@Service
public class ImageOptimizationServiceImpl implements IImageOptimizationService {

    private static final String[] ALLOWED_EXTENSIONS = { "jpg", "jpeg", "png", "gif", "bmp", "webp" };

    @Override
    public String optimizeImage(MultipartFile file, Path outputPath, int maxWidth, int maxHeight, float quality)
            throws IOException {
        System.out.println("=== ImageOptimizationService.optimizeImage ===");
        System.out.println("File: " + file.getOriginalFilename());
        System.out.println("Output path: " + outputPath.toString());
        System.out.println("Max size: " + maxWidth + "x" + maxHeight);
        System.out.println("Quality: " + quality);

        if (!isValidImageFile(file)) {
            throw new IllegalArgumentException("File không phải là ảnh hợp lệ");
        }

        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        if (originalImage == null) {
            throw new IOException("Không thể đọc file ảnh");
        }

        System.out.println("Original image size: " + originalImage.getWidth() + "x" + originalImage.getHeight());

        // Tính toán kích thước mới
        Dimension newSize = calculateNewSize(originalImage.getWidth(), originalImage.getHeight(), maxWidth, maxHeight);

        // Tạo ảnh mới với kích thước đã tối ưu
        BufferedImage optimizedImage = new BufferedImage(newSize.width, newSize.height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = optimizedImage.createGraphics();

        // Cải thiện chất lượng vẽ
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        g2d.drawImage(originalImage, 0, 0, newSize.width, newSize.height, null);
        g2d.dispose();

        // Tạo thư mục nếu chưa tồn tại
        Files.createDirectories(outputPath.getParent());

        // Lưu ảnh với chất lượng tối ưu
        String extension = getFileExtension(file.getOriginalFilename());
        String formatName = getImageFormat(extension);

        if ("jpeg".equalsIgnoreCase(formatName) || "jpg".equalsIgnoreCase(formatName)) {
            saveWithQuality(optimizedImage, outputPath, formatName, quality);
        } else {
            ImageIO.write(optimizedImage, formatName, outputPath.toFile());
        }

        return outputPath.toString();
    }

    @Override
    public String createThumbnail(MultipartFile file, Path outputPath, int thumbnailSize) throws IOException {
        return optimizeImage(file, outputPath, thumbnailSize, thumbnailSize, 0.7f);
    }

    @Override
    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String filename = file.getOriginalFilename();
        if (filename == null) {
            return false;
        }

        String extension = getFileExtension(filename).toLowerCase();
        for (String allowedExt : ALLOWED_EXTENSIONS) {
            if (allowedExt.equals(extension)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public long getOptimizedFileSize(MultipartFile file, int maxWidth, int maxHeight, float quality)
            throws IOException {
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        if (originalImage == null) {
            return file.getSize();
        }

        Dimension newSize = calculateNewSize(originalImage.getWidth(), originalImage.getHeight(), maxWidth, maxHeight);

        // Tạo ảnh tạm để tính kích thước
        BufferedImage tempImage = new BufferedImage(newSize.width, newSize.height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = tempImage.createGraphics();
        g2d.drawImage(originalImage, 0, 0, newSize.width, newSize.height, null);
        g2d.dispose();

        // Ghi vào ByteArrayOutputStream để tính kích thước
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String extension = getFileExtension(file.getOriginalFilename());
        String formatName = getImageFormat(extension);

        if ("jpeg".equalsIgnoreCase(formatName) || "jpg".equalsIgnoreCase(formatName)) {
            saveWithQualityToStream(tempImage, baos, formatName, quality);
        } else {
            ImageIO.write(tempImage, formatName, baos);
        }

        return baos.size();
    }

    private Dimension calculateNewSize(int originalWidth, int originalHeight, int maxWidth, int maxHeight) {
        if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
            return new Dimension(originalWidth, originalHeight);
        }

        double widthRatio = (double) maxWidth / originalWidth;
        double heightRatio = (double) maxHeight / originalHeight;
        double ratio = Math.min(widthRatio, heightRatio);

        int newWidth = (int) (originalWidth * ratio);
        int newHeight = (int) (originalHeight * ratio);

        return new Dimension(newWidth, newHeight);
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    private String getImageFormat(String extension) {
        switch (extension.toLowerCase()) {
            case "png":
                return "png";
            case "gif":
                return "gif";
            case "bmp":
                return "bmp";
            case "webp":
                return "webp";
            default:
                return "jpeg";
        }
    }

    private void saveWithQuality(BufferedImage image, Path outputPath, String formatName, float quality)
            throws IOException {
        // Đảm bảo thư mục tồn tại
        Files.createDirectories(outputPath.getParent());

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName(formatName);
        if (!writers.hasNext()) {
            // Fallback: lưu ảnh đơn giản nếu không có writer
            ImageIO.write(image, formatName, outputPath.toFile());
            return;
        }

        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();

        // Kiểm tra xem có hỗ trợ compression không
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);
        }

        try (ImageOutputStream ios = ImageIO.createImageOutputStream(outputPath.toFile())) {
            if (ios != null) {
                writer.setOutput(ios);
                writer.write(null, new javax.imageio.IIOImage(image, null, null), param);
            } else {
                // Fallback nếu không tạo được ImageOutputStream
                ImageIO.write(image, formatName, outputPath.toFile());
            }
        } catch (Exception e) {
            // Fallback nếu có lỗi
            ImageIO.write(image, formatName, outputPath.toFile());
        } finally {
            writer.dispose();
        }
    }

    private void saveWithQualityToStream(BufferedImage image, ByteArrayOutputStream baos, String formatName,
            float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName(formatName);
        if (!writers.hasNext()) {
            ImageIO.write(image, formatName, baos);
            return;
        }

        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();

        // Kiểm tra xem có hỗ trợ compression không
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);
        }

        try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            if (ios != null) {
                writer.setOutput(ios);
                writer.write(null, new javax.imageio.IIOImage(image, null, null), param);
            } else {
                // Fallback nếu không tạo được ImageOutputStream
                ImageIO.write(image, formatName, baos);
            }
        } catch (Exception e) {
            // Fallback nếu có lỗi
            ImageIO.write(image, formatName, baos);
        } finally {
            writer.dispose();
        }
    }
}
