package com.backend.lumotus;

import com.backend.lumotus.config.AdminProperties;
import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.config.CloudinaryProperties;
import com.backend.lumotus.config.GoogleProperties;
import com.backend.lumotus.config.JwtProperties;
import com.backend.lumotus.config.RedisProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
    JwtProperties.class,
    AppProperties.class,
    AdminProperties.class,
    RedisProperties.class,
    GoogleProperties.class,
    CloudinaryProperties.class
})
public class LumotusApplication {

    public static void main(String[] args) {
        SpringApplication.run(LumotusApplication.class, args);
    }
}
