package vn.liora.controller.admin;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.response.UserResponse;
import vn.liora.dto.request.UserCreationRequest;
import vn.liora.dto.request.UserUpdateRequest;
import vn.liora.service.IUserService;

import java.util.List;

@RestController
@RequestMapping("/admin/api/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@PreAuthorize("hasAuthority('user.view')")
public class AdminUserController {
    IUserService userService;

    @GetMapping
    public ApiResponse<List<UserResponse>> getAll() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.findAll())
                .build();
    }

    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> getById(@PathVariable Long userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.findById(userId))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('user.create')")
    public ApiResponse<UserResponse> create(@Valid @RequestBody UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('user.update')")
    public ApiResponse<UserResponse> update(@PathVariable Long userId, @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('user.delete')")
    public ApiResponse<String> delete(@PathVariable Long userId) {
        userService.deleteById(userId);
        return ApiResponse.<String>builder().result("User has been deleted").build();
    }
}
