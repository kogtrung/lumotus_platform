package com.backend.lumotus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Dev bootstrap: gán role ADMIN cho user có email cấu hình (sau khi đã đăng ký).
 * Để trống trên production.
 */
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(String bootstrapEmail) {}
