package com.glancy.backend;

import com.glancy.backend.util.EnvLoader;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

/**
 * Application entry point for the Glancy dictionary backend.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@Slf4j
public class GlancyBackendApplication {

    /**
     * Bootstraps the Spring application while loading DB credentials
     * from a .env file for convenience during development.
     */
    public static void main(String[] args) {
        EnvLoader.load(java.nio.file.Paths.get(".env"));
        SpringApplication.run(GlancyBackendApplication.class, args);
    }

    /**
     * Shared RestTemplate bean for downstream API calls.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
