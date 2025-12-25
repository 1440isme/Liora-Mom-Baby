package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.transaction.Transactional;
import vn.liora.dto.request.UserCreationRequest;
import vn.liora.dto.request.UserUpdateRequest;
import vn.liora.dto.request.ChangePasswordRequest;
import vn.liora.dto.response.UserResponse;
import vn.liora.entity.User;
import vn.liora.enums.Role;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.UserMapper;
import vn.liora.repository.RoleRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.IUserService;
import vn.liora.service.IAuthenticationService;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserServiceImpl implements IUserService {

    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    IAuthenticationService authenticationService;

    @Override
    @Transactional
    public void deleteAll() {
        userRepository.deleteAll();
    }

    @Override
    @Transactional
    public void delete(User user) {
        userRepository.delete(user);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public long count() {
        return userRepository.count();
    }

    @Override
    @Transactional
    public UserResponse createUser(UserCreationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Defaults
        if (user.getCreatedDate() == null) {
            user.setCreatedDate(LocalDate.now());
        }
        if (user.getActive() == null) {
            user.setActive(true);
        }

        // Set role based on request or default to USER
        String roleName = request.getRole() != null ? request.getRole() : Role.USER.name();
        var selectedRole = roleRepository.findById(roleName)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        user.setRoles(Set.of(selectedRole));

        return userMapper.toUserResponse(save(user));
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        // Preserve current password unless a new one is provided
        String currentHashedPassword = user.getPassword();
        // Preserve created date
        LocalDate currentCreatedDate = user.getCreatedDate();

        userMapper.updateUser(user, request);

        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        } else {
            // Keep previous password to avoid NULL updates
            user.setPassword(currentHashedPassword);
        }
        // Always keep original created date
        user.setCreatedDate(currentCreatedDate);
        boolean rolesChanged = false;
        if (request.getRoles() != null) {
            var roles = roleRepository.findAllById(request.getRoles());
            user.setRoles(new HashSet<>(roles));
            rolesChanged = true;
        }

        User savedUser = save(user);

        // Force refresh token if roles were changed
        if (rolesChanged) {
            try {
                authenticationService.forceRefreshTokenForUser(savedUser.getUsername());
            } catch (Exception e) {
                // Log error but don't fail the update
                System.err
                        .println("Failed to refresh token for user " + savedUser.getUsername() + ": " + e.getMessage());
            }
        }

        return userMapper.toUserResponse(savedUser);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @Override
    public UserResponse findById(Long id) {
        return userMapper.toUserResponse(userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)));
    }

    @Override
    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    @Override
    public Optional<User> findByIdOptional(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public List<User> findAllById(Iterable<Long> ids) {
        return userRepository.findAllById(ids);
    }

    @Override
    public List<User> findAll(Sort sort) {
        return userRepository.findAll(sort);
    }

    @Override
    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @Override
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    @Override
    public <S extends User> S save(S entity) {
        return userRepository.save(entity);
    }

    @Override
    public List<User> findByUsernameContaining(String username) {
        return userRepository.findByUsernameContaining(username);
    }

    @Override
    public Page<User> findByUsernameContaining(String username, Pageable pageable) {
        return userRepository.findByUsernameContaining(username, pageable);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public long countNewCustomersThisMonth() {
        return userRepository.countNewCustomersThisMonth();
    }
    
    @Override
    public long countNewCustomersByDateRange(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return userRepository.countByRegistrationDateBetween(startDate, endDate);
    }
    
    @Override
    public List<Object[]> getNewCustomersByMonth(java.time.LocalDateTime startDate) {
        return userRepository.countNewCustomersByMonth(startDate);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        // Check if new password and confirm password match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        // Check if new password is different from current password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT);
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        save(user);
    }

    @Override
    @Transactional
    public void deactivateAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Set active to false instead of deleting
        user.setActive(false);
        save(user);
    }
}
