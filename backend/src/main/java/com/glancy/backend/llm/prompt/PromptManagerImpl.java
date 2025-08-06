package com.glancy.backend.llm.prompt;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.stereotype.Component;

@Component
public class PromptManagerImpl implements PromptManager {

    @Override
    public String loadPrompt(String path) {
        try {
            return Files.readString(Path.of("src/main/resources/" + path));
        } catch (IOException e) {
            throw new RuntimeException("Prompt load failed: " + path, e);
        }
    }
}
