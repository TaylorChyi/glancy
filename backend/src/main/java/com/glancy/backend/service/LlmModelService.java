package com.glancy.backend.service;

import com.glancy.backend.llm.llm.LLMClientFactory;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/** Provides available LLM model names in a sorted list. */
@Slf4j
@Service
public class LlmModelService {

  private final LLMClientFactory clientFactory;

  public LlmModelService(LLMClientFactory clientFactory) {
    this.clientFactory = clientFactory;
  }

  /** Returns all registered LLM client names sorted alphabetically. */
  public List<String> getModelNames() {
    log.debug("Fetching registered LLM client names");
    List<String> names = clientFactory.getClientNames();
    log.debug("Available models: {}", names);
    return names;
  }
}
