package com.backend.lumotus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        String secret,
        long accessTokenExpiryMs,
        int refreshTokenExpiryDays) {
}
