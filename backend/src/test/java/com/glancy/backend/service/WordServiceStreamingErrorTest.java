package com.glancy.backend.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

/**
 * 验证 streamWordForUser 在出现异常时会封装 IllegalStateException。
 */
class WordServiceStreamingErrorTest {

    private WordService wordService;

    @Mock
    private WordSearcher wordSearcher;

    @Mock
    private WordRepository wordRepository;

    @Mock
    private SearchRecordService searchRecordService;

    @Mock
    private SearchResultService searchResultService;

    @Mock
    private WordResponseParser parser;

    @Mock
    private WordPersonalizationService wordPersonalizationService;

    private WordPersonalizationContext personalizationContext;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        personalizationContext = new WordPersonalizationContext(
            "自驱力强的青年进阶者",
            true,
            "大学或初入职场的伙伴",
            "突破商务演讲",
            "柔和而坚定",
            List.of("金融"),
            List.of("equity")
        );
        when(wordPersonalizationService.resolveContext(anyLong())).thenReturn(personalizationContext);
        when(wordPersonalizationService.personalize(any(WordPersonalizationContext.class), any())).thenReturn(
            new PersonalizedWordExplanation("persona", "key", "context", List.of(), List.of())
        );
        objectMapper = Jackson2ObjectMapperBuilder.json().build();
        wordService = new WordService(
            wordSearcher,
            wordRepository,
            searchRecordService,
            searchResultService,
            parser,
            wordPersonalizationService,
            objectMapper
        );
    }

    /**
     * 步骤：
     * 1. 构造 searchRecordService 的保存返回，确保业务前置流程顺利通过。
     * 2. 令 wordSearcher.streamSearch 抛出运行时异常模拟底层流式查询错误。
     * 3. 调用 streamWordForUser 并断言最终异常被包装为 IllegalStateException，且包含原始信息。
     */
    @Test
    void wrapsExceptionFromSearcher() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse());
        when(wordSearcher.streamSearch(any(), any(), any(), any(), any())).thenThrow(new RuntimeException("boom"));
        Flux<WordService.StreamPayload> result = wordService.streamWordForUser(
            1L,
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
        );
        StepVerifier.create(result)
            .expectErrorMatches(e -> e instanceof IllegalStateException && e.getMessage().contains("boom"))
            .verify();
    }

    private SearchRecordResponse sampleRecordResponse() {
        return new SearchRecordResponse(
            20L,
            1L,
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            LocalDateTime.now(),
            Boolean.FALSE,
            null,
            List.of()
        );
    }
}
