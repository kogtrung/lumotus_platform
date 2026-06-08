package com.backend.lumotus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Cors cors) {

    public record Cors(String allowedOrigins) {
    }
}
