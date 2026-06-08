package com.backend.lumotus.config;

import com.backend.lumotus.entity.User;
import com.backend.lumotus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.admin", name = "bootstrap-email")
@Slf4j
public class AdminBootstrapRunner implements ApplicationRunner {

    private final AdminProperties adminProperties;
    private final UserRepository userRepository;

    @Override
    public void run(ApplicationArguments args) {
        String email = adminProperties.bootstrapEmail();
        if (!StringUtils.hasText(email)) {
            return;
        }
        userRepository
                .findByEmail(email.trim())
                .ifPresentOrElse(
                        user -> promoteIfNeeded(user, email),
                        () -> log.warn(
                                "ADMIN bootstrap: user {} chưa tồn tại — đăng ký trước, restart backend để được gán ADMIN",
                                email));
    }

    private void promoteIfNeeded(User user, String email) {
        if (user.getRole() == User.Role.ADMIN) {
            log.debug("ADMIN bootstrap: {} đã là ADMIN", email);
            return;
        }
        user.setRole(User.Role.ADMIN);
        userRepository.save(user);
        log.info("ADMIN bootstrap: promoted {} to ADMIN", email);
    }
}
