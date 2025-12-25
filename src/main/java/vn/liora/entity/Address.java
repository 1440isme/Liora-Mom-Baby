package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Address")
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdAddress")
    Long idAddress;
    @Column(name = "Name", nullable = false, columnDefinition = "NVARCHAR(255)")
    String name;
    @Column(name = "Phone", nullable = false)
    String phone;
    @Column(name = "AddressDetail", nullable = false, columnDefinition = "NVARCHAR(255)")
    String addressDetail;
    @Column(name = "ProvinceId")
    Integer provinceId; // GHN province_id

    @Column(name = "DistrictId")
    Integer districtId; // GHN district_id

    @Column(name = "WardCode")
    String wardCode; // GHN ward_code (string)

    @Column(name = "IsDefault")
    @Builder.Default
    Boolean isDefault = false;

    @ManyToOne
    @JoinColumn(name = "IdUser")
    @JsonIgnore
    private User user;

}
