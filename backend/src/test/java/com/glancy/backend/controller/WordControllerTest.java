package com.glancy.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.WordService;
import com.glancy.backend.service.word.WordSearchOptions;
import java.util.List;
import java.util.function.Consumer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@WebMvcTest(WordController.class)
@Import({
  com.glancy.backend.config.security.SecurityConfig.class,
  com.glancy.backend.config.WebConfig.class,
  com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
})
class WordControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private WordService wordService;

  @MockitoBean private UserService userService;

  @BeforeEach
  void mockAuthentication() {
    Mockito.when(userService.authenticateToken("tkn")).thenReturn(1L);
  }

  @Test
  void testGetWord() throws Exception {
    performWordLookup(
            defaultOptions("hello"),
            response("1", "hello"),
            builder ->
                builder
                    .withHeaderToken("tkn")
                    .withTerm("hello")
                    .withLanguage(Language.ENGLISH))
        .andDo(print())
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("1"))
        .andExpect(MockMvcResultMatchers.jsonPath("$.term").value("hello"));
  }

  /** 测试携带模型参数时接口正常工作 */
  @Test
  void testGetWordWithModel() throws Exception {
    performWordLookup(
            WordSearchOptions.of(
                "hello",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL,
                "doubao",
                false,
                true),
            response("1", "hello"),
            builder ->
                builder
                    .withHeaderToken("tkn")
                    .withTerm("hello")
                    .withLanguage(Language.ENGLISH)
                    .withModel("doubao"))
        .andDo(print())
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("1"));
  }

  /** 测试 testGetWordMissingTerm 接口 */
  @Test
  void testGetWordMissingTerm() throws Exception {
    mockMvc
        .perform(
            wordRequest()
                .withHeaderToken("tkn")
                .withLanguage(Language.ENGLISH)
                .build())
        .andDo(print())
        .andExpect(MockMvcResultMatchers.status().isBadRequest())
        .andExpect(
            MockMvcResultMatchers.jsonPath("$.message").value("Missing required parameter: term"));
  }

  /** 测试 testGetWordInvalidLanguage 接口 */
  @Test
  void testGetWordInvalidLanguage() throws Exception {
    mockMvc
        .perform(
            wordRequest()
                .withHeaderToken("tkn")
                .withTerm("hello")
                .withLanguageValue("INVALID")
                .build())
        .andDo(print())
        .andExpect(MockMvcResultMatchers.status().isBadRequest())
        .andExpect(
            MockMvcResultMatchers.jsonPath("$.message")
                .value("Invalid value for parameter: language"));
  }

  /** Test access with token query parameter. */
  @Test
  void whenTokenProvidedViaQueryParam_thenStatusIsOk() throws Exception {
    performQueryTokenLookup().andExpect(MockMvcResultMatchers.status().isOk());
  }

  @Test
  void whenTokenProvidedViaQueryParam_thenTermEchoesResponse() throws Exception {
    performQueryTokenLookup().andExpect(MockMvcResultMatchers.jsonPath("$.term").value("hi"));
  }

  /** 验证 captureHistory=false 时会禁用历史记录采集。 */
  @Test
  void whenCaptureHistoryDisabled_thenStatusIsOk() throws Exception {
    WordSearchOptions options = captureHistoryOptions("hello", false);
    performCaptureHistoryDisabledLookup(options)
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("1"));
  }

  @Test
  void whenCaptureHistoryDisabled_thenHistoryFlagFalse() throws Exception {
    WordSearchOptions options = captureHistoryOptions("hello", false);
    performCaptureHistoryDisabledLookup(options);
    Mockito.verify(wordService)
        .findWordForUser(ArgumentMatchers.eq(1L), ArgumentMatchers.eq(options));
  }

  private ResultActions performQueryTokenLookup() throws Exception {
    return performWordLookup(
        defaultOptions("hi"),
        response("1", "hi"),
        builder ->
            builder
                .withQueryToken("tkn")
                .withTerm("hi")
                .withLanguage(Language.ENGLISH));
  }
  private ResultActions performCaptureHistoryDisabledLookup(WordSearchOptions options)
      throws Exception {
    return performWordLookup(
        options,
        response("1", "hello"),
        builder ->
            builder
                .withHeaderToken("tkn")
                .withTerm("hello")
                .withLanguage(Language.ENGLISH)
                .withCaptureHistory(false));
  }
  private ResultActions performWordLookup(
      WordSearchOptions expectedOptions,
      WordResponse resp,
      Consumer<WordRequestBuilder> customizer)
      throws Exception {
    Mockito.when(
            wordService.findWordForUser(
                ArgumentMatchers.eq(1L), ArgumentMatchers.eq(expectedOptions)))
        .thenReturn(resp);
    WordRequestBuilder builder = wordRequest();
    customizer.accept(builder);
    return mockMvc.perform(builder.build());
  }

  private WordSearchOptions defaultOptions(String term) {
    return captureHistoryOptions(term, true);
  }

  private WordSearchOptions captureHistoryOptions(String term, boolean captureHistory) {
    return WordSearchOptions.of(
        term, Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, captureHistory);
  }

  private WordRequestBuilder wordRequest() {
    return new WordRequestBuilder();
  }

  private WordResponse response(String id, String term) {
    return new WordResponse(
        id,
        term,
        List.of("g"),
        Language.ENGLISH,
        "ex",
        "həˈloʊ",
        List.of(),
        List.of(),
        List.of(),
        List.of(),
        List.of(),
        null,
        null,
        null,
        DictionaryFlavor.BILINGUAL);
  }

  private static final class WordRequestBuilder {
    private final MockHttpServletRequestBuilder delegate;
    private WordRequestBuilder() {
      this.delegate = get("/api/words").accept(MediaType.APPLICATION_JSON);
    }
    private WordRequestBuilder withHeaderToken(String token) {
      delegate.header("X-USER-TOKEN", token);
      return this;
    }
    private WordRequestBuilder withQueryToken(String token) {
      delegate.param("token", token);
      return this;
    }
    private WordRequestBuilder withTerm(String term) {
      delegate.param("term", term);
      return this;
    }
    private WordRequestBuilder withLanguage(Language language) {
      return withLanguageValue(language.name());
    }
    private WordRequestBuilder withLanguageValue(String language) {
      delegate.param("language", language);
      return this;
    }
    private WordRequestBuilder withModel(String model) {
      delegate.param("model", model);
      return this;
    }
    private WordRequestBuilder withCaptureHistory(boolean captureHistory) {
      delegate.param("captureHistory", Boolean.toString(captureHistory));
      return this;
    }
    private MockHttpServletRequestBuilder build() {
      return delegate;
    }
  }
}
