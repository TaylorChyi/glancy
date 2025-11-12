package com.glancy.backend.llm.service;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.config.LLMConfig;
import com.glancy.backend.llm.llm.DictionaryModelClient;
import com.glancy.backend.llm.llm.DictionaryModelClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.prompt.PromptManager;
import com.glancy.backend.llm.prompt.PromptTemplateRenderer;
import com.glancy.backend.llm.search.SearchContentManager;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

class WordSearcherImplTest {

  private static final WordPersonalizationContext NO_PERSONALIZATION_CONTEXT =
      new WordPersonalizationContext(null, false, null, null, null, List.of(), List.of());

  private DictionaryModelClientFactory factory;
  private LLMConfig config;
  private PromptManager promptManager;
  private SearchContentManager searchContentManager;
  private WordResponseParser parser;
  private DictionaryModelClient defaultClient;
  private WordPromptAssembler promptAssembler;
  private PromptTemplateRenderer templateRenderer;
  private static final String DEFAULT_CLIENT = "doubao";

  @SuppressWarnings("unchecked")
  private static ArgumentCaptor<List<ChatMessage>> chatMessagesCaptor() {
    return ArgumentCaptor.forClass((Class<List<ChatMessage>>) (Class<?>) List.class);
  }

  @BeforeEach
  void setUp() {
    factory = Mockito.mock(DictionaryModelClientFactory.class);
    config = new LLMConfig();
    config.setDefaultClient(DEFAULT_CLIENT);
    config.setTemperature(0.5);
    config.setPromptPath("path");
    config.setPromptPaths(Map.of("ENGLISH", "path-en", "CHINESE", "path-zh"));
    promptManager = Mockito.mock(PromptManager.class);
    searchContentManager = Mockito.mock(SearchContentManager.class);
    parser = Mockito.mock(WordResponseParser.class);
    defaultClient = Mockito.mock(DictionaryModelClient.class);
    templateRenderer = new PromptTemplateRenderer();
    WordEntryProfileResolver entryProfileResolver = new WordEntryProfileResolver(templateRenderer);
    promptAssembler = new WordPromptAssembler(templateRenderer, entryProfileResolver);
  }

  /** 验证当指定的模型不存在时，会优雅回退到默认的 doubao 模型并完成查询。测试通过模拟工厂返回空实例，随后校验默认模型被调用。 */
  @Test
  void searchFallsBackToDefaultWhenClientMissing() {
    WordResponse expected = stubFallbackScenario("invalid", "hello", Language.ENGLISH);
    WordSearcherImpl searcher = newSearcher();
    WordResponse result =
        searcher.search(
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            "invalid",
            NO_PERSONALIZATION_CONTEXT);

    Assertions.assertSame(expected, result);
    Mockito.verify(factory).get("invalid");
    Mockito.verify(factory).get(DEFAULT_CLIENT);
    Mockito.verify(defaultClient)
        .generateEntry(ArgumentMatchers.anyList(), ArgumentMatchers.eq(0.5));
    Mockito.verify(promptManager).loadPrompt("path-en");
  }

  /** 验证默认模型缺失时会抛出非法状态异常。测试通过模拟工厂对指定模型及默认模型均返回空值，从而确认搜索流程终止于异常抛出。 */
  @Test
  void searchThrowsWhenDefaultMissing() {
    Mockito.when(factory.get("invalid")).thenReturn(null);
    Mockito.when(factory.get(DEFAULT_CLIENT)).thenReturn(null);
    WordSearcherImpl searcher = newSearcher();
    Assertions.assertThrows(
        IllegalStateException.class,
        () ->
            searcher.search(
                "hi",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL,
                "invalid",
                NO_PERSONALIZATION_CONTEXT));
  }

  /**
   * 测试目标：验证中文查询场景会在用户消息中追加条目结构定位与写作指引。 前置条件：模拟 LLM 工厂返回默认客户端，Prompt 管理器提供中文模板，搜索内容归一化为单字。 步骤： 1)
   * 触发双语模式中文搜索； 2) 捕获发送给模型的用户消息。 断言： - 用户消息包含「条目结构定位」与「写作指引」关键字段。 边界/异常： -
   * 若缺失条目结构定位，说明引导模板未生效，应快速定位。
   */
  @Test
  void chineseSearchAnnotatesStructureGuidance() {
    stubSuccessfulResponse("汉", Language.CHINESE, "path-zh");
    WordSearcherImpl searcher = newSearcher();
    searcher.search(
        "汉", Language.CHINESE, DictionaryFlavor.BILINGUAL, "doubao", NO_PERSONALIZATION_CONTEXT);

    ArgumentCaptor<List<ChatMessage>> messagesCaptor = chatMessagesCaptor();
    Mockito.verify(defaultClient).generateEntry(messagesCaptor.capture(), ArgumentMatchers.eq(0.5));
    ChatMessage userMessage =
        messagesCaptor.getValue().stream()
            .filter(msg -> "user".equals(msg.getRole()))
            .findFirst()
            .orElseThrow();
    String content = userMessage.getContent();
    Assertions.assertTrue(content.contains("条目结构定位：Single Character"));
    Assertions.assertTrue(content.contains("写作指引：请拆解字源"));
  }

  /** 验证英文双语模式会追加中文译文提示，确保模型在双语词典模式下输出包含中文内容。 */
  @Test
  void englishBilingualSearchAddsChineseInstruction() {
    stubSuccessfulResponse("elegance", Language.ENGLISH, "path-en");
    WordSearcherImpl searcher = newSearcher();
    searcher.search(
        "elegance",
        Language.ENGLISH,
        DictionaryFlavor.BILINGUAL,
        "doubao",
        NO_PERSONALIZATION_CONTEXT);

    ArgumentCaptor<List<ChatMessage>> messagesCaptor = chatMessagesCaptor();
    Mockito.verify(defaultClient).generateEntry(messagesCaptor.capture(), ArgumentMatchers.eq(0.5));
    boolean hasInstruction =
        messagesCaptor.getValue().stream()
            .filter(message -> "system".equals(message.getRole()))
            .anyMatch(message -> message.getContent().contains("中文译文"));
    Assertions.assertTrue(hasInstruction);
  }

  /**
   * 测试目标：确认英文检索的用户负载不再包含「条目类型」段落。 前置条件：模拟默认客户端、英文 Prompt、归一化后的英文词条，以及带哨兵的模型返回值。 步骤： 1) 触发英文单语检索； 2)
   * 捕获发送给模型的用户消息内容。 断言： - 用户消息不包含「条目类型」字符串，避免多余章节要求。 边界/异常： - 如仍存在条目类型字段，说明指令未同步，需回滚或继续排查。
   */
  @Test
  void englishSearchOmitsEntryTypeSection() {
    stubSuccessfulResponse("elegance", Language.ENGLISH, "path-en");
    WordSearcherImpl searcher = newSearcher();
    searcher.search(
        "elegance",
        Language.ENGLISH,
        DictionaryFlavor.MONOLINGUAL_ENGLISH,
        "doubao",
        NO_PERSONALIZATION_CONTEXT);

    ArgumentCaptor<List<ChatMessage>> messagesCaptor = chatMessagesCaptor();
    Mockito.verify(defaultClient).generateEntry(messagesCaptor.capture(), ArgumentMatchers.eq(0.5));
    ChatMessage userMessage =
        messagesCaptor.getValue().stream()
            .filter(message -> "user".equals(message.getRole()))
            .findFirst()
            .orElseThrow();

    Assertions.assertFalse(
        userMessage.getContent().contains("条目类型"), "英文检索用户消息仍包含「条目类型」字段，提示模板未同步");
  }

  private void stubSuccessfulResponse(String term, Language language, String promptKey) {
    Mockito.when(factory.get(DEFAULT_CLIENT)).thenReturn(defaultClient);
    Mockito.when(promptManager.loadPrompt(promptKey)).thenReturn("prompt");
    Mockito.when(searchContentManager.normalize(term)).thenReturn(term);
    Mockito.when(
            defaultClient.generateEntry(
                ArgumentMatchers.anyList(), ArgumentMatchers.eq(config.getTemperature())))
        .thenReturn("content<END>");
    Mockito.when(parser.parse("content", term, language))
        .thenReturn(new ParsedWord(new WordResponse(), "content<END>"));
  }

  private WordResponse stubFallbackScenario(
      String requestedClient, String term, Language language) {
    Mockito.when(factory.get(requestedClient)).thenReturn(null);
    Mockito.when(factory.get(DEFAULT_CLIENT)).thenReturn(defaultClient);
    Mockito.when(promptManager.loadPrompt("path-en")).thenReturn("prompt");
    Mockito.when(searchContentManager.normalize(term)).thenReturn(term);
    Mockito.when(
            defaultClient.generateEntry(
                ArgumentMatchers.anyList(), ArgumentMatchers.eq(config.getTemperature())))
        .thenReturn("content");
    WordResponse expected = new WordResponse();
    expected.setMarkdown("content");
    Mockito.when(parser.parse("content", term, language))
        .thenReturn(new ParsedWord(expected, "content"));
    return expected;
  }

  private WordSearcherImpl newSearcher() {
    return new WordSearcherImpl(
        factory, config, promptManager, searchContentManager, parser, promptAssembler);
  }
}
