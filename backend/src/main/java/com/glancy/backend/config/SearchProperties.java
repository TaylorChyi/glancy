package com.glancy.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "search")
public class SearchProperties {

    private Limit limit = new Limit();

    @Data
    public static class Limit {

        private int nonMember = 10;
    }
}
