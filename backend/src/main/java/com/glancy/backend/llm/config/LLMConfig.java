package com.glancy.backend.llm.config;

import java.util.Map;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "llm")
public class LLMConfig {

  private String defaultClient = "deepseek";
  private double temperature = 0.7;
  private Map<String, String> apiKeys;
  private String promptPath = "prompts/english_to_chinese.txt";
}
