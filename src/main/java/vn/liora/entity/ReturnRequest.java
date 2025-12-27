package vn.liora.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "return_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReturnRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_return_request")
    Long idReturnRequest;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_order", nullable = false)
    Order order;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    String reason;
    
    @Column(nullable = false, length = 20)
    String status; // PENDING, ACCEPTED, REJECTED
    
    @Column(name = "created_date")
    LocalDateTime createdDate;
    
    @Column(name = "processed_date")
    LocalDateTime processedDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    User processedBy;
    
    @Column(name = "admin_note", columnDefinition = "TEXT")
    String adminNote;
    
    @PrePersist
    protected void onCreate() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }
}
