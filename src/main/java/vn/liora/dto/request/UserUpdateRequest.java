package vn.liora.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.liora.validator.DobConstraint;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    private String password;
    private String email;
    private String phone;
    private String firstname;
    private String lastname;
    @DobConstraint(min = 6, message = "INVALID_DOB")
    private LocalDate dob;
    private Boolean gender;
    private String avatar;
    private Boolean active;
    private LocalDate createdDate;
    List<String> roles;
}
