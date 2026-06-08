package com.backend.lumotus;

import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.config.JwtProperties;
import com.backend.lumotus.config.RedisProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, AppProperties.class, RedisProperties.class})
public class LumotusApplication {

    public static void main(String[] args) {
        SpringApplication.run(LumotusApplication.class, args);
    }
}
