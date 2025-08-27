package com.glancy.backend.llm.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class LLMClientResolverTest {

  private LLMClientFactory factory;
  private LLMConfig config;
  private LLMClient defaultClient;

  @BeforeEach
  void setUp() {
    factory = mock(LLMClientFactory.class);
    config = new LLMConfig();
    config.setDefaultClient("deepseek");
    defaultClient = mock(LLMClient.class);
  }

  @Test
  void fallsBackToDefaultWhenClientMissing() {
    when(factory.get("invalid")).thenReturn(null);
    when(factory.get("deepseek")).thenReturn(defaultClient);
    LLMClientResolver resolver = new LLMClientResolver(factory, config);
    LLMClientResolver.Selection sel = resolver.resolve("invalid");
    assertSame(defaultClient, sel.client());
    assertEquals("deepseek", sel.name());
  }

  @Test
  void throwsWhenDefaultMissing() {
    when(factory.get("invalid")).thenReturn(null);
    when(factory.get("deepseek")).thenReturn(null);
    LLMClientResolver resolver = new LLMClientResolver(factory, config);
    assertThrows(IllegalStateException.class, () -> resolver.resolve("invalid"));
  }
}
