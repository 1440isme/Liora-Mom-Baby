package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import vn.liora.dto.CustomOAuth2User;
import vn.liora.enums.Role;
import vn.liora.entity.User;
import vn.liora.repository.RoleRepository;
import vn.liora.repository.UserRepository;

import java.time.LocalDate;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        // Lấy thông tin từ Google
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");

        // Tìm hoặc tạo user mới
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    var duplicates = userRepository.findAllByEmail(email);
                    if (duplicates != null && !duplicates.isEmpty()) {
                        return duplicates.get(0);
                    }
                    return createNewUser(email, name, picture);
                });

        return new CustomOAuth2User(oauth2User, user);
    }

    private User createNewUser(String email, String name, String picture) {
        // Tạo username từ email
        String username = email.split("@")[0];

        // Đảm bảo username là duy nhất
        String originalUsername = username;
        int counter = 1;
        while (userRepository.findByUsername(username).isPresent()) {
            username = originalUsername + counter++;
        }

        // Tách firstname và lastname
        String[] nameParts = name.split(" ");
        String firstname = nameParts[0];
        String lastname = nameParts.length > 1
                ? String.join(" ", java.util.Arrays.copyOfRange(nameParts, 1, nameParts.length))
                : "";

        // Lấy role USER mặc định
        vn.liora.entity.Role userRole = roleRepository.findById(Role.USER.name())
                .orElseThrow(() -> new RuntimeException("Role USER not found"));

        User newUser = User.builder()
                .username(username)
                .email(email)
                .firstname(firstname)
                .lastname(lastname)
                .avatar(picture)
                .password("") // OAuth2 user không cần password
                .active(true)
                .createdDate(LocalDate.now())
                .roles(Set.of(userRole))
                .build();

        return userRepository.save(newUser);
    }
}
