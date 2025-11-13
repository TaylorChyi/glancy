package com.glancy.backend.llm.config;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import java.util.Map;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Data
@Component
@ConfigurationProperties(prefix = "llm")
public class LLMConfig {

    private String defaultClient = "doubao";
    private double temperature = 0.7;
    private Map<String, String> apiKeys;
    private String promptPath = "prompts/english_to_chinese.txt";
    private Map<String, String> promptPaths;
    private Map<String, Map<String, String>> promptFlavorPaths;

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

    public String resolvePromptPath(Language language, DictionaryFlavor flavor) {
        if (language != null && flavor != null && promptFlavorPaths != null) {
            String languageKey = language.name();
            Map<String, String> flavorMap = promptFlavorPaths.get(languageKey);
            if (flavorMap == null) {
                flavorMap = promptFlavorPaths.get(languageKey.toLowerCase());
            }
            if (flavorMap != null) {
                String flavorKey = flavor.name();
                String candidate = flavorMap.get(flavorKey);
                if (!StringUtils.hasText(candidate)) {
                    candidate = flavorMap.get(flavorKey.toLowerCase());
                }
                if (StringUtils.hasText(candidate)) {
                    return candidate;
                }
            }
        }
        return resolvePromptPath(language);
    }
}
