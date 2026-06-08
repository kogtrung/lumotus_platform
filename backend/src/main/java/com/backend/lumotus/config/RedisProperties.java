package com.backend.lumotus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.redis")
public record RedisProperties(int refreshTokenTtlDays) {
}
