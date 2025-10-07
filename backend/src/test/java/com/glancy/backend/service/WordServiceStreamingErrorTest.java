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
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.search.SearchContentManagerImpl;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import com.glancy.backend.service.support.SearchContentDictionaryTermNormalizer;
import com.glancy.backend.service.support.WordPersistenceCoordinator;
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
    private DictionaryTermNormalizer termNormalizer;
    private WordPersistenceCoordinator wordPersistenceCoordinator;

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
        termNormalizer = new SearchContentDictionaryTermNormalizer(new SearchContentManagerImpl());
        wordPersistenceCoordinator = new WordPersistenceCoordinator();
        wordService = new WordService(
            wordSearcher,
            wordRepository,
            searchRecordService,
            searchResultService,
            parser,
            wordPersonalizationService,
            termNormalizer,
            objectMapper,
            wordPersistenceCoordinator
        );
    }

    /**
     * 测试目标：验证底层流式抛出异常时会包装为 IllegalStateException。
     * 前置条件：
     *  - searchRecordService.saveRecord 正常返回；wordRepository 无缓存命中。
     * 步骤：
     *  1) 模拟 wordSearcher.streamSearch 抛出运行时异常。
     *  2) 调用 streamWordForUser 获取结果。
     * 断言：
     *  - 观察到 IllegalStateException 且消息包含原始异常信息。
     * 边界/异常：
     *  - 覆盖流式异常包裹路径。
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
            false,
            true
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
