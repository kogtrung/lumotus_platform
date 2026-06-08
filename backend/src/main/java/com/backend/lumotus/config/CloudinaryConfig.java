package com.backend.lumotus.config;

import com.cloudinary.Cloudinary;
import java.util.HashMap;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(CloudinaryProperties props) {
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", props.cloudName() != null ? props.cloudName() : "");
        config.put("api_key", props.apiKey() != null ? props.apiKey() : "");
        config.put("api_secret", props.apiSecret() != null ? props.apiSecret() : "");
        return new Cloudinary(config);
    }
}
