package vn.liora.dto.request;

import jakarta.persistence.Column;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.liora.validator.DobConstraint;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class UserCreationRequest {
    @Size(min = 3, message = "USERNAME_INVALID")
    @Column(unique = true)
    private String username;
    @Size(min = 8, message = "PASSWORD_INVALID")
    private String password;
    @Email
    private String email;
    private String phone;
    private String firstname;
    private String lastname;
    @DobConstraint(min = 8, message = "INVALID_DOB")
    private LocalDate dob;
    private Boolean gender;
    private String avatar;
    private Boolean active;
    private LocalDate createdDate;
    private String role;
}
