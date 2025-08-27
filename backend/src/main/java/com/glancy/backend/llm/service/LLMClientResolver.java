package com.glancy.backend.llm.service;

import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LLMClientResolver {

  private final LLMClientFactory factory;
  private final LLMConfig config;

  public record Selection(String name, LLMClient client) {}

  public LLMClientResolver(LLMClientFactory factory, LLMConfig config) {
    this.factory = factory;
    this.config = config;
  }

  public Selection resolve(String preferred) {
    String name = preferred != null ? preferred : config.getDefaultClient();
    LLMClient client = factory.get(name);
    if (client != null) {
      return new Selection(name, client);
    }
    log.warn("LLM client '{}' not found, falling back to default", name);
    String fallback = config.getDefaultClient();
    client = factory.get(fallback);
    if (client == null) {
      throw new IllegalStateException(
          String.format(
              "LLM client '%s' not available and default '%s' not configured",
              name, fallback));
    }
    return new Selection(fallback, client);
  }
}
