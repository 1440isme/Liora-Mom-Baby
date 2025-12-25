package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdUser")
    Long userId;
    @Column(name = "Username", nullable = false, unique = true)
    String username;
    @Column(name = "Password", nullable = false)
    String password;
    @Column(name = "Email", nullable = false, unique = true)
    String email;
    @Column(name = "Phone")
    String phone;
    @Column(name = "Firstname", nullable = false, columnDefinition = "NVARCHAR(100)")
    String firstname;
    @Column(name = "Lastname", nullable = false, columnDefinition = "NVARCHAR(100)")
    String lastname;
    @Column(name = "DoB")
    LocalDate dob;
    @Column(name = "Gender")
    Boolean gender;
    @Column(name = "Avatar")
    String avatar;
    @Column(name = "Active")
    Boolean active;
    @Column(name = "CreatedDate")
    LocalDate createdDate;

    @ManyToMany
    @JoinTable(name = "User_Role")
    Set<Role> roles;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Cart cart;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Order> orders;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Address> addresses;

}
