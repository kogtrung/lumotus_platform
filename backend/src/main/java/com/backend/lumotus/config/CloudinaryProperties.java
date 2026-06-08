package com.backend.lumotus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cloudinary")
public record CloudinaryProperties(
        String cloudName, String apiKey, String apiSecret, String folder, int maxFileSizeMb) {

    public boolean isConfigured() {
        return cloudName != null
                && !cloudName.isBlank()
                && apiKey != null
                && !apiKey.isBlank()
                && apiSecret != null
                && !apiSecret.isBlank();
    }

    public String baseFolder() {
        return folder == null || folder.isBlank() ? "lumotus" : folder.trim();
    }
}
