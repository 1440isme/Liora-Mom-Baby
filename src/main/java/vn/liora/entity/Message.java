package vn.liora.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.PrePersist;
import java.time.OffsetDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "Message")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdMessage")
    private Long id;


    @Column(name = "RoomId", nullable = false, length = 100)
    private String roomId;


    @Column(name = "SenderId", nullable = false)
    private Long senderId;


    @Column(name = "SenderName", nullable = false, length = 100)
    private String senderName;


    @Column(name = "Role", nullable = false, length = 20)
    private String role;


    @Column(name = "Content", columnDefinition = "NVARCHAR(2000)")
    private String content;

    @Column(name = "ImageUrl", length = 500)
    private String imageUrl;

    @Column(name = "CreatedAt", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "Seen", nullable = false)
    private boolean seen;


    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
