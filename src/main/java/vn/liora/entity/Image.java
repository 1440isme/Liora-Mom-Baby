package vn.liora.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "Images")
public class Image {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdImage")
    private Long imageId;

    @Column(name = "ImageUrl", columnDefinition = "NVARCHAR(255)")
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IdProduct")
    private Product product;

    // Thêm field này để phân biệt ảnh chính
    @Column(name = "IsMain", nullable = false)
    private Boolean isMain = false;

    // Thêm field thứ tự hiển thị
    @Column(name = "DisplayOrder")
    private Integer displayOrder;

}
