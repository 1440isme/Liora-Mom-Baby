package vn.liora.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "Roles")
public class Role {
    @Id
    @EqualsAndHashCode.Include
    String name;
    @Column(name = "Description", columnDefinition = "NVARCHAR(255)")
    String description;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "Role_Permission")
    @ToString.Exclude
    Set<Permission> permissions;
}
