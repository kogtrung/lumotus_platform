package com.backend.lumotus.security;

import com.backend.lumotus.config.RedisProperties;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    public static final String COOKIE_NAME = "refresh_token";
    private static final String USER_KEY_PREFIX = "refresh_token:";
    private static final String LOOKUP_PREFIX = "refresh:lookup:";

    private final StringRedisTemplate redis;
    private final RedisProperties redisProperties;

    public String issue(UUID userId) {
        revoke(userId);
        String token = UUID.randomUUID().toString();
        Duration ttl = Duration.ofDays(redisProperties.refreshTokenTtlDays());
        redis.opsForValue().set(USER_KEY_PREFIX + userId, token, ttl);
        redis.opsForValue().set(LOOKUP_PREFIX + token, userId.toString(), ttl);
        return token;
    }

    public Optional<UUID> validate(String token) {
        String userId = redis.opsForValue().get(LOOKUP_PREFIX + token);
        if (userId == null) {
            return Optional.empty();
        }
        String stored = redis.opsForValue().get(USER_KEY_PREFIX + userId);
        if (!token.equals(stored)) {
            return Optional.empty();
        }
        return Optional.of(UUID.fromString(userId));
    }

    public void revoke(UUID userId) {
        String token = redis.opsForValue().get(USER_KEY_PREFIX + userId);
        if (token != null) {
            redis.delete(LOOKUP_PREFIX + token);
        }
        redis.delete(USER_KEY_PREFIX + userId);
    }
}
