package com.glancy.backend.llm.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.prompt.PromptManager;
import com.glancy.backend.llm.search.SearchContentManager;
import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class WordSearcherImplTest {

    private static final WordPersonalizationContext NO_PERSONALIZATION_CONTEXT = new WordPersonalizationContext(
        null,
        false,
        null,
        null,
        null,
        List.of(),
        List.of()
    );

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
        config.setDefaultClient("doubao");
        config.setTemperature(0.5);
        config.setPromptPath("path");
        config.setPromptPaths(Map.of("ENGLISH", "path-en", "CHINESE", "path-zh"));
        promptManager = mock(PromptManager.class);
        searchContentManager = mock(SearchContentManager.class);
        parser = mock(WordResponseParser.class);
        defaultClient = mock(LLMClient.class);
    }

    /**
     * 验证当指定的模型不存在时，会优雅回退到默认的 doubao 模型并完成查询。测试通过模拟工厂返回空实例，随后校验默认模型被调用。
     */
    @Test
    void searchFallsBackToDefaultWhenClientMissing() {
        when(factory.get("invalid")).thenReturn(null);
        when(factory.get("doubao")).thenReturn(defaultClient);
        when(promptManager.loadPrompt("path-en")).thenReturn("prompt");
        when(searchContentManager.normalize("hello")).thenReturn("hello");
        when(defaultClient.chat(anyList(), eq(0.5))).thenReturn("content");
        WordResponse expected = new WordResponse();
        expected.setMarkdown("content");
        when(parser.parse("content", "hello", Language.ENGLISH)).thenReturn(new ParsedWord(expected, "content"));
        WordSearcherImpl searcher = new WordSearcherImpl(factory, config, promptManager, searchContentManager, parser);
        WordResponse result = searcher.search("hello", Language.ENGLISH, "invalid", NO_PERSONALIZATION_CONTEXT);

        assertSame(expected, result);
        verify(factory).get("invalid");
        verify(factory).get("doubao");
        verify(defaultClient).chat(anyList(), eq(0.5));
        verify(promptManager).loadPrompt("path-en");
    }

    /**
     * 验证默认模型缺失时会抛出非法状态异常。测试通过模拟工厂对指定模型及默认模型均返回空值，从而确认搜索流程终止于异常抛出。
     */
    @Test
    void searchThrowsWhenDefaultMissing() {
        when(factory.get("invalid")).thenReturn(null);
        when(factory.get("doubao")).thenReturn(null);
        WordSearcherImpl searcher = new WordSearcherImpl(factory, config, promptManager, searchContentManager, parser);
        assertThrows(IllegalStateException.class, () ->
            searcher.search("hi", Language.ENGLISH, "invalid", NO_PERSONALIZATION_CONTEXT)
        );
    }

    /**
     * 验证中文查询时会在用户消息中标注条目类型，确保模型区分汉字与词语的输出格式。
     */
    @Test
    void chineseSearchAnnotatesEntryType() {
        when(factory.get("doubao")).thenReturn(defaultClient);
        when(promptManager.loadPrompt("path-zh")).thenReturn("prompt");
        when(searchContentManager.normalize("汉")).thenReturn("汉");
        when(defaultClient.chat(anyList(), eq(0.5))).thenReturn("content<END>");
        WordResponse expected = new WordResponse();
        when(parser.parse("content<END>", "汉", Language.CHINESE))
            .thenReturn(new ParsedWord(expected, "content<END>"));

        WordSearcherImpl searcher = new WordSearcherImpl(factory, config, promptManager, searchContentManager, parser);
        searcher.search("汉", Language.CHINESE, "doubao", NO_PERSONALIZATION_CONTEXT);

        ArgumentCaptor<List<ChatMessage>> messagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(defaultClient).chat(messagesCaptor.capture(), eq(0.5));
        ChatMessage userMessage = messagesCaptor
            .getValue()
            .stream()
            .filter(msg -> "user".equals(msg.getRole()))
            .findFirst()
            .orElseThrow();
        String content = userMessage.getContent();
        assertTrue(content.contains("汉字"));
        assertTrue(content.contains("说文解字"));
    }
}
