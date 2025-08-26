package com.glancy.backend.llm.prompt;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

@Component
public class PromptManagerImpl implements PromptManager {

  @Override
  public String loadPrompt(String path) {
    try {
      ClassPathResource resource = new ClassPathResource(path);
      return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new RuntimeException("Prompt load failed: " + path, e);
    }
  }
}
