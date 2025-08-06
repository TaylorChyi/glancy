package com.glancy.backend.llm.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.prompt.PromptManager;
import com.glancy.backend.llm.search.SearchContentManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WordSearcherImplTest {

    private LLMClientFactory factory;
    private LLMConfig config;
    private PromptManager promptManager;
    private SearchContentManager searchContentManager;
    private WordResponseParser parser;
    private LLMClient defaultClient;

    @BeforeEach
    void setUp() {
        factory = mock(LLMClientFactory.class);
        config = new LLMConfig();
        config.setDefaultClient("deepseek");
        config.setTemperature(0.5);
        config.setPromptPath("path");
        promptManager = mock(PromptManager.class);
        searchContentManager = mock(SearchContentManager.class);
        parser = mock(WordResponseParser.class);
        defaultClient = mock(LLMClient.class);
    }

    @Test
    void searchFallsBackToDefaultWhenClientMissing() {
        when(factory.get("invalid")).thenReturn(null);
        when(factory.get("deepseek")).thenReturn(defaultClient);
        when(promptManager.loadPrompt(anyString())).thenReturn("prompt");
        when(searchContentManager.normalize("hello")).thenReturn("hello");
        when(defaultClient.chat(anyList(), eq(0.5))).thenReturn("content");
        WordResponse expected = new WordResponse();
        when(parser.parse("content", "hello", Language.ENGLISH)).thenReturn(expected);

        WordSearcherImpl searcher = new WordSearcherImpl(factory, config, promptManager, searchContentManager, parser);
        WordResponse result = searcher.search("hello", Language.ENGLISH, "invalid");

        assertSame(expected, result);
        verify(factory).get("invalid");
        verify(factory).get("deepseek");
        verify(defaultClient).chat(anyList(), eq(0.5));
    }

    @Test
    void searchThrowsWhenDefaultMissing() {
        when(factory.get("invalid")).thenReturn(null);
        when(factory.get("deepseek")).thenReturn(null);
        WordSearcherImpl searcher = new WordSearcherImpl(factory, config, promptManager, searchContentManager, parser);
        assertThrows(IllegalStateException.class, () -> searcher.search("hi", Language.ENGLISH, "invalid"));
    }
}
