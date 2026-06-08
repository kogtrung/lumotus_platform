package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.LoginRequest;
import com.backend.lumotus.dto.request.RegisterRequest;
import com.backend.lumotus.dto.response.AuthResponse;
import com.backend.lumotus.dto.response.UserResponse;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.exception.ConflictException;
import com.backend.lumotus.exception.UnauthorizedException;
import com.backend.lumotus.repository.UserRepository;
import com.backend.lumotus.security.JwtService;
import com.backend.lumotus.security.RefreshTokenService;
import com.backend.lumotus.security.UserPrincipal;
import java.util.UUID;
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
        User user = userRepository
                .findById(principal.getId())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return UserResponse.from(user);
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
