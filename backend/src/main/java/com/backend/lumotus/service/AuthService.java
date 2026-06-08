package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.ChangePasswordRequest;
import com.backend.lumotus.dto.request.GoogleLoginRequest;
import com.backend.lumotus.dto.request.LoginRequest;
import com.backend.lumotus.dto.request.RegisterRequest;
import com.backend.lumotus.dto.request.UpdateProfileRequest;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.dto.response.AuthResponse;
import com.backend.lumotus.dto.response.UserResponse;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.exception.ConflictException;
import com.backend.lumotus.exception.UnauthorizedException;
import com.backend.lumotus.repository.UserRepository;
import com.backend.lumotus.security.GoogleTokenVerifier;
import com.backend.lumotus.security.GoogleTokenVerifier.GoogleUserInfo;
import com.backend.lumotus.security.JwtService;
import com.backend.lumotus.security.RefreshTokenService;
import com.backend.lumotus.security.UserPrincipal;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Transactional
    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already registered");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new ConflictException("Username already taken");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(User.Role.USER);
        userRepository.save(user);

        return issueTokens(user);
    }

    public AuthResult login(LoginRequest request) {
        User user = userRepository
                .findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is disabled");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResult googleLogin(GoogleLoginRequest request) {
        GoogleUserInfo googleUser = googleTokenVerifier.verify(request.idToken());

        User user = userRepository
                .findByOauthProviderAndOauthSubject(User.OauthProvider.GOOGLE, googleUser.subject())
                .orElseGet(() -> resolveOrCreateGoogleUser(googleUser));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is disabled");
        }

        return issueTokens(user);
    }

    public AuthResult refresh(String refreshToken) {
        UUID userId = refreshTokenService
                .validate(refreshToken)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (!user.isActive()) {
            refreshTokenService.revoke(userId);
            throw new UnauthorizedException("Account is disabled");
        }

        return issueTokens(user);
    }

    public void logout(UUID userId) {
        refreshTokenService.revoke(userId);
    }

    public UserResponse getMe(UserPrincipal principal) {
        return UserResponse.from(findUserOrThrow(principal.getId()));
    }

    @Transactional
    public UserResponse updateProfile(UserPrincipal principal, UpdateProfileRequest request) {
        if (request.username() == null && request.avatarUrl() == null) {
            throw new BadRequestException("At least one field must be provided");
        }
        User user = findUserOrThrow(principal.getId());
        if (request.username() != null) {
            String username = request.username().trim();
            if (!username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
                throw new ConflictException("Username already taken");
            }
            user.setUsername(username);
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(blankToNull(request.avatarUrl()));
        }
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(UserPrincipal principal, ChangePasswordRequest request) {
        User user = findUserOrThrow(principal.getId());
        if (user.getOauthProvider() != null) {
            throw new BadRequestException("Password change is not available for OAuth accounts");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from current password");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        refreshTokenService.revoke(user.getId());
    }

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private User resolveOrCreateGoogleUser(GoogleUserInfo googleUser) {
        return userRepository.findByEmail(googleUser.email()).map(existing -> {
            if (existing.getOauthProvider() != null
                    && !User.OauthProvider.GOOGLE.equals(existing.getOauthProvider())) {
                throw new ConflictException("Email already registered with another provider");
            }
            if (existing.getOauthSubject() != null
                    && !existing.getOauthSubject().equals(googleUser.subject())) {
                throw new ConflictException("Email already linked to another Google account");
            }
            existing.setOauthProvider(User.OauthProvider.GOOGLE);
            existing.setOauthSubject(googleUser.subject());
            if (existing.getAvatarUrl() == null && googleUser.pictureUrl() != null) {
                existing.setAvatarUrl(googleUser.pictureUrl());
            }
            return userRepository.save(existing);
        }).orElseGet(() -> createGoogleUser(googleUser));
    }

    private User createGoogleUser(GoogleUserInfo googleUser) {
        User user = new User();
        user.setEmail(googleUser.email());
        user.setUsername(generateUniqueUsername(googleUser));
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setAvatarUrl(googleUser.pictureUrl());
        user.setOauthProvider(User.OauthProvider.GOOGLE);
        user.setOauthSubject(googleUser.subject());
        user.setRole(User.Role.USER);
        return userRepository.save(user);
    }

    private String generateUniqueUsername(GoogleUserInfo googleUser) {
        String base = googleUser.email().split("@")[0]
                .replaceAll("[^a-zA-Z0-9_]", "")
                .toLowerCase();
        if (base.length() < 3) {
            base = "user";
        }
        if (base.length() > 40) {
            base = base.substring(0, 40);
        }
        String candidate = base;
        int attempt = 0;
        while (userRepository.existsByUsername(candidate)) {
            attempt++;
            candidate = base + ThreadLocalRandom.current().nextInt(1000, 9999);
            if (attempt > 20) {
                candidate = base + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }
        return candidate;
    }

    private AuthResult issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.issue(user.getId());
        return new AuthResult(accessToken, refreshToken, UserResponse.from(user));
    }

    public record AuthResult(String accessToken, String refreshToken, UserResponse user) {

        public AuthResponse toResponse() {
            return AuthResponse.of(accessToken, user);
        }
    }
}
