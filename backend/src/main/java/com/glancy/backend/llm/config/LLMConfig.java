package com.glancy.backend.llm.config;

import com.glancy.backend.entity.Language;
import java.util.Map;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "llm")
public class LLMConfig {

    private String defaultClient = "doubao";
    private double temperature = 0.7;
    private Map<String, String> apiKeys;
    private String promptPath = "prompts/english_to_chinese.txt";
    private Map<String, String> promptPaths;

    public String resolvePromptPath(Language language) {
        if (promptPaths != null && language != null) {
            String key = language.name();
            String candidate = promptPaths.getOrDefault(key, promptPaths.get(key.toLowerCase()));
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return promptPath;
    }
}
