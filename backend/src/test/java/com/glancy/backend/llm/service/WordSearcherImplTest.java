package com.glancy.backend.llm.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.prompt.PromptManager;
import com.glancy.backend.llm.search.SearchContentManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

class WordSearcherImplTest {

  private LLMClientResolver resolver;
  private LLMConfig config;
  private PromptManager promptManager;
  private SearchContentManager searchContentManager;
  private LLMClient client;

  @BeforeEach
  void setUp() {
    resolver = mock(LLMClientResolver.class);
    config = new LLMConfig();
    config.setDefaultClient("deepseek");
    config.setTemperature(0.5);
    config.setPromptPath("path");
    promptManager = mock(PromptManager.class);
    searchContentManager = mock(SearchContentManager.class);
    client = mock(LLMClient.class);
  }

  @Test
  void streamSearchUsesResolvedClient() {
    when(promptManager.loadPrompt(anyString())).thenReturn("prompt");
    when(searchContentManager.normalize("hello")).thenReturn("hello");
    when(resolver.resolve("deepseek"))
        .thenReturn(new LLMClientResolver.Selection("deepseek", client));
    when(client.streamChat(anyList(), eq(0.5))).thenReturn(Flux.just("content"));

    WordSearcherImpl searcher =
        new WordSearcherImpl(resolver, config, promptManager, searchContentManager);

    Flux<String> result = searcher.streamSearch("hello", Language.ENGLISH, "deepseek");

    StepVerifier.create(result).expectNext("content").verifyComplete();
    verify(resolver).resolve("deepseek");
    verify(client).streamChat(anyList(), eq(0.5));
  }
}
