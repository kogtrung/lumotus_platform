package com.backend.lumotus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sm2")
public record Sm2Properties(
        float minEase,
        int masteredIntervalDays,
        Intervals intervals,
        Ease ease) {

    public record Intervals(int first, int second, int third) {
    }

    public record Ease(float a, float b, float c) {
    }
}
