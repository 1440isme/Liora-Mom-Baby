package vn.liora.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.liora.entity.*;
import vn.liora.repository.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatbotDataService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private BrandRepository brandRepository;
    
    @Autowired
    private OrderRepository orderRepository;

    /**
     * Load toàn bộ dữ liệu database và format cho Gemini
     */
    public String getCompleteDatabaseContext() {
        try {
            StringBuilder context = new StringBuilder();
            
            // Load thống kê tổng quan
            context.append("=== THỐNG KÊ TỔNG QUAN LORIA BEAUTY ===\n");
            long totalProducts = productRepository.count();
            long totalUsers = userRepository.count();
            long totalCategories = categoryRepository.count();
            long totalBrands = brandRepository.count();
            long totalOrders = orderRepository.count();
            BigDecimal totalRevenue = orderRepository.getTotalRevenue();
            if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;
            
            context.append(String.format("Tổng sản phẩm: %d\n", totalProducts));
            context.append(String.format("Tổng khách hàng: %d\n", totalUsers));
            context.append(String.format("Tổng danh mục: %d\n", totalCategories));
            context.append(String.format("Tổng thương hiệu: %d\n", totalBrands));
            context.append(String.format("Tổng đơn hàng: %d\n", totalOrders));
            context.append(String.format("Tổng doanh thu: %s VNĐ\n\n", totalRevenue));
            
            // Load tất cả thương hiệu
            context.append("=== DANH SÁCH THƯƠNG HIỆU ===\n");
            List<Brand> brands = brandRepository.findAll();
            for (Brand brand : brands) {
                context.append(String.format("- %s (ID: %d)\n", brand.getName(), brand.getBrandId()));
            }
            context.append("\n");
            
            // Load tất cả danh mục
            context.append("=== DANH SÁCH DANH MỤC ===\n");
            List<Category> categories = categoryRepository.findAll();
            for (Category category : categories) {
                context.append(String.format("- %s (ID: %d)\n", category.getName(), category.getCategoryId()));
            }
            context.append("\n");
            
            // Load tất cả sản phẩm với thông tin chi tiết
            context.append("=== DANH SÁCH SẢN PHẨM ===\n");
            List<Product> products = productRepository.findAll();
            for (Product product : products) {
                context.append(String.format("ID: %d\n", product.getProductId()));
                context.append(String.format("Tên: %s\n", product.getName()));
                context.append(String.format("Mô tả: %s\n", product.getDescription()));
                context.append(String.format("Giá: %s VNĐ\n", product.getPrice()));
                context.append(String.format("Tồn kho: %d\n", product.getStock()));
                context.append(String.format("Đã bán: %d\n", product.getSoldCount()));
                if (product.getBrand() != null) {
                    context.append(String.format("Thương hiệu: %s\n", product.getBrand().getName()));
                }
                if (product.getCategory() != null) {
                    context.append(String.format("Danh mục: %s\n", product.getCategory().getName()));
                }
                context.append(String.format("Ngày tạo: %s\n", product.getCreatedDate()));
                context.append("---\n");
            }
            
            // Load sản phẩm bán chạy
            context.append("\n=== SẢN PHẨM BÁN CHẠY ===\n");
            List<Product> bestSelling = products.stream()
                .sorted((p1, p2) -> Integer.compare(p2.getSoldCount(), p1.getSoldCount()))
                .limit(10)
                .collect(Collectors.toList());
            
            for (int i = 0; i < bestSelling.size(); i++) {
                Product product = bestSelling.get(i);
                context.append(String.format("%d. %s - %s VNĐ (Đã bán: %d)\n", 
                    i + 1, product.getName(), product.getPrice(), product.getSoldCount()));
            }
            
            return context.toString();
        } catch (Exception e) {
            return "Lỗi khi load dữ liệu database: " + e.getMessage();
        }
    }

    /**
     * Load dữ liệu sản phẩm theo format ngắn gọn cho Gemini
     */
    public String getProductsSummary() {
        try {
            StringBuilder summary = new StringBuilder();
            List<Product> products = productRepository.findAll();
            
            summary.append("DANH SÁCH SẢN PHẨM LORIA BEAUTY:\n");
            for (Product product : products) {
                summary.append(String.format("%d. %s - %s VNĐ (Còn: %d, Đã bán: %d)", 
                    product.getProductId(), 
                    product.getName(), 
                    product.getPrice(), 
                    product.getStock(), 
                    product.getSoldCount()));
                
                if (product.getBrand() != null) {
                    summary.append(" [").append(product.getBrand().getName()).append("]");
                }
                if (product.getCategory() != null) {
                    summary.append(" (").append(product.getCategory().getName()).append(")");
                }
                summary.append("\n");
            }
            
            return summary.toString();
        } catch (Exception e) {
            return "Lỗi khi load tóm tắt sản phẩm: " + e.getMessage();
        }
    }

    /**
     * Load thông tin thương hiệu và danh mục
     */
    public String getBrandsAndCategories() {
        try {
            StringBuilder info = new StringBuilder();
            
            info.append("THƯƠNG HIỆU:\n");
            List<Brand> brands = brandRepository.findAll();
            for (Brand brand : brands) {
                info.append(String.format("- %s\n", brand.getName()));
            }
            
            info.append("\nDANH MỤC:\n");
            List<Category> categories = categoryRepository.findAll();
            for (Category category : categories) {
                info.append(String.format("- %s\n", category.getName()));
            }
            
            return info.toString();
        } catch (Exception e) {
            return "Lỗi khi load thương hiệu và danh mục: " + e.getMessage();
        }
    }
}
