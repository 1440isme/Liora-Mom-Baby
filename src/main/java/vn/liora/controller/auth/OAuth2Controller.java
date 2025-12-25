package vn.liora.controller.auth;

import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;
import vn.liora.dto.CustomOAuth2User;
import vn.liora.entity.User;
import vn.liora.enums.Role;
import vn.liora.repository.RoleRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.IAuthenticationService;

@Controller
@RequiredArgsConstructor
public class OAuth2Controller {

    private final IAuthenticationService authenticationService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @GetMapping("/authenticate")
    public RedirectView handleOAuth2Success() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) {
                return new RedirectView("/?auth=error");
            }

            Object principal = authentication.getPrincipal();
            User userEntity = null;

            if (principal instanceof CustomOAuth2User customUser) {
                userEntity = customUser.getUser();
            } else {
                java.util.Map<String, Object> attrs = java.util.Collections.emptyMap();
                if (principal instanceof OidcUser oidcUser) {
                    attrs = oidcUser.getClaims();
                } else if (principal instanceof OAuth2User oauth2User) {
                    attrs = oauth2User.getAttributes();
                }

                String email = (String) attrs.getOrDefault("email", "");
                String name = (String) attrs.getOrDefault("name", "");
                String picture = (String) attrs.getOrDefault("picture", "");

                if (email == null || email.isBlank()) {
                    return new RedirectView("/?auth=error");
                }

                userEntity = userRepository.findByEmail(email).orElseGet(() -> {
                    String username = email.split("@")[0];
                    String original = username;
                    int c = 1;
                    while (userRepository.findByUsername(username).isPresent()) {
                        username = original + c++;
                    }
                    String[] parts = name != null ? name.split(" ") : new String[] { username };
                    String firstname = parts.length > 0 ? parts[0] : username;
                    String lastname = parts.length > 1
                            ? String.join(" ", java.util.Arrays.copyOfRange(parts, 1, parts.length))
                            : "";
                    vn.liora.entity.Role userRole = roleRepository.findById(Role.USER.name())
                            .orElseThrow(() -> new RuntimeException("Role USER not found"));
                    return User.builder()
                            .username(username)
                            .email(email)
                            .firstname(firstname)
                            .lastname(lastname)
                            .avatar(picture)
                            .password("")
                            .active(true)
                            .createdDate(java.time.LocalDate.now())
                            .roles(java.util.Set.of(userRole))
                            .build();
                });

                if (userEntity.getUserId() == null) {
                    userEntity = userRepository.save(userEntity);
                }
            }

            if (Boolean.FALSE.equals(userEntity.getActive())) {
                return new RedirectView("/?auth=error&reason=locked");
            }
            String token = authenticationService.generateTokenForOAuth2User(userEntity);
            return new RedirectView("/?token=" + token + "&auth=success");
        } catch (JOSEException e) {
            return new RedirectView("/?auth=error");
        }
    }
}
