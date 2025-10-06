package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.search.SearchContentManagerImpl;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import com.glancy.backend.service.support.SearchContentDictionaryTermNormalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

/**
 * WordService streamWordForUser 相关行为测试。
 */
class WordServiceStreamPersistenceTest {

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
    private PersonalizedWordExplanation personalization;
    private ObjectMapper objectMapper;
    private DictionaryTermNormalizer termNormalizer;

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
        personalization = new PersonalizedWordExplanation("persona", "key", "context", List.of(), List.of());
        when(wordPersonalizationService.resolveContext(anyLong())).thenReturn(personalizationContext);
        when(wordPersonalizationService.personalize(any(WordPersonalizationContext.class), any())).thenReturn(
            personalization
        );
        objectMapper = Jackson2ObjectMapperBuilder.json().build();
        termNormalizer = new SearchContentDictionaryTermNormalizer(new SearchContentManagerImpl());
        when(searchRecordService.synchronizeRecordTerm(anyLong(), anyLong(), any())).thenReturn(null);
        wordService = new WordService(
            wordSearcher,
            wordRepository,
            searchRecordService,
            searchResultService,
            parser,
            wordPersonalizationService,
            termNormalizer,
            objectMapper
        );
    }

    /**
     * 测试目标：验证命中缓存时直接返回缓存数据并跳过模型流式调用。
     * 前置条件：
     *  - wordRepository.findActiveByNormalizedTerm 返回目标词条；个性化上下文可正常解析。
     * 步骤：
     *  1) 构造缓存词条并触发 streamWordForUser。
     *  2) 订阅单次事件流。
     * 断言：
     *  - 推送的数据与缓存序列化结果一致。
     *  - 未触发 wordSearcher.streamSearch 调用。
     * 边界/异常：
     *  - 覆盖 forceNew=false 且缓存命中的路径。
     */
    @Test
    void returnsCachedWord() {
        Word word = new Word();
        word.setId(1L);
        word.setTerm("cached");
        word.setNormalizedTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("def"));
        word.setMarkdown("md");
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("cached"));
        when(
            wordRepository.findActiveByNormalizedTerm("cached", Language.ENGLISH, DictionaryFlavor.BILINGUAL)
        ).thenReturn(Optional.of(word));

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "cached",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false,
            true
        );

        WordResponse expected = new WordResponse(
            "1",
            "cached",
            List.of("def"),
            Language.ENGLISH,
            null,
            null,
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            "md",
            null,
            personalization,
            DictionaryFlavor.BILINGUAL
        );
        String expectedJson;
        try {
            expectedJson = objectMapper.writeValueAsString(expected);
        } catch (JsonProcessingException e) {
            fail(e);
            return;
        }

        StepVerifier.create(flux)
            .expectNextMatches(payload -> payload.event() == null && expectedJson.equals(payload.data()))
            .verifyComplete();
        verify(wordSearcher, never()).streamSearch(any(), any(), any(), any(), any());
        verify(searchRecordService).saveRecord(eq(1L), any());
    }

    /**
     * 测试目标：验证流式会话完整结束后会解析并持久化词条与版本。
     * 前置条件：
     *  - wordRepository.findActiveByNormalizedTerm 返回空；模型流返回带哨兵的内容。
     * 步骤：
     *  1) 调用 streamWordForUser 触发流式输出。
     *  2) 订阅事件直至完成。
     * 断言：
     *  - 推送 version 事件且 ID 符合预期。
     *  - wordRepository.save 与 searchResultService.createVersion 均被调用。
     * 边界/异常：
     *  - 覆盖正常流式持久化分支。
     */
    @Test
    void savesAfterStreaming() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(wordRepository.findActiveByNormalizedTerm("hi", Language.ENGLISH, DictionaryFlavor.BILINGUAL)).thenReturn(
            Optional.empty()
        );
        when(
            wordSearcher.streamSearch(
                eq("hi"),
                eq(Language.ENGLISH),
                eq(DictionaryFlavor.BILINGUAL),
                eq("doubao"),
                any()
            )
        ).thenReturn(Flux.just("{\"term\":\"hi\"}", "<END>"));
        WordResponse resp = new WordResponse(
            null,
            "hi",
            List.of("greet"),
            Language.ENGLISH,
            null,
            null,
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            "{\"term\":\"hi\"}",
            null,
            null,
            DictionaryFlavor.BILINGUAL
        );
        when(parser.parse("{\"term\":\"hi\"}", "hi", Language.ENGLISH)).thenReturn(
            new ParsedWord(resp, "{\"term\":\"hi\"}")
        );
        when(wordRepository.save(any())).thenAnswer(invocation -> {
                Word w = invocation.getArgument(0);
                w.setId(1L);
                return w;
            });
        SearchResultVersion version = new SearchResultVersion();
        version.setId(88L);
        when(
            searchResultService.createVersion(
                anyLong(),
                anyLong(),
                anyString(),
                any(Language.class),
                anyString(),
                anyString(),
                any(Word.class),
                any(DictionaryFlavor.class)
            )
        ).thenReturn(version);

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false,
            true
        );

        StepVerifier.create(flux)
            .expectNextMatches(payload -> payload.data().contains("hi") && payload.event() == null)
            .expectNextMatches(payload -> "<END>".equals(payload.data()) && payload.event() == null)
            .expectNextMatches(payload -> "version".equals(payload.event()) && "88".equals(payload.data()))
            .verifyComplete();
        verify(wordRepository).save(argThat(w -> "{\"term\":\"hi\"}".equals(w.getMarkdown())));
        verify(searchResultService).createVersion(
            anyLong(),
            anyLong(),
            anyString(),
            any(Language.class),
            anyString(),
            anyString(),
            any(Word.class),
            any(DictionaryFlavor.class)
        );
        verify(searchRecordService).synchronizeRecordTerm(eq(1L), eq(10L), eq("hi"));
    }

    /**
     * 测试目标：captureHistory=false 时跳过流式持久化流程。\
     * 前置条件：缓存未命中且模型输出包含完成哨兵。\
     * 步骤：\
     *  1) 调用 streamWordForUser 并消费生成器。\
     * 断言：\
     *  - 仅收到数据事件，无 version 事件；\
     *  - searchRecordService.saveRecord 与 searchResultService.createVersion 均未被调用。\
     * 边界/异常：覆盖禁用历史采集的流式路径。\
     */
    @Test
    void skipsPersistenceWhenHistoryDisabled() {
        when(wordRepository.findActiveByNormalizedTerm("hi", Language.ENGLISH, DictionaryFlavor.BILINGUAL)).thenReturn(
            Optional.empty()
        );
        when(
            wordSearcher.streamSearch(
                eq("hi"),
                eq(Language.ENGLISH),
                eq(DictionaryFlavor.BILINGUAL),
                eq("doubao"),
                any()
            )
        ).thenReturn(Flux.just("{\"term\":\"hi\"}", "<END>"));
        WordResponse resp = new WordResponse(
            null,
            "hi",
            List.of("greet"),
            Language.ENGLISH,
            null,
            null,
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            "{\"term\":\"hi\"}",
            null,
            null,
            DictionaryFlavor.BILINGUAL
        );
        when(parser.parse("{\"term\":\"hi\"}", "hi", Language.ENGLISH)).thenReturn(
            new ParsedWord(resp, "{\"term\":\"hi\"}")
        );
        when(wordRepository.save(any())).thenAnswer(invocation -> {
                Word w = invocation.getArgument(0);
                w.setId(2L);
                return w;
            });

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false,
            false
        );

        StepVerifier.create(flux)
            .expectNextMatches(payload -> payload.event() == null && payload.data().contains("\"term\""))
            .expectNextMatches(payload -> payload.event() == null && "<END>".equals(payload.data()))
            .verifyComplete();

        verify(searchRecordService, never()).saveRecord(anyLong(), any());
        verify(searchResultService, never()).createVersion(
            anyLong(),
            anyLong(),
            anyString(),
            any(Language.class),
            anyString(),
            anyString(),
            any(Word.class),
            any(DictionaryFlavor.class)
        );
    }

    /**
     * 测试目标：验证缺少完成哨兵时不会解析或持久化词条。
     * 前置条件：
     *  - wordRepository.findActiveByNormalizedTerm 返回空；流式输出缺失 CompletionSentinel。
     * 步骤：
     *  1) 触发 streamWordForUser 并消费单次输出。
     * 断言：
     *  - 未调用 parser.parse、wordRepository.save、searchResultService.createVersion。
     * 边界/异常：
     *  - 覆盖异常流中缺失哨兵的容错路径。
     */
    @Test
    void skipPersistenceWhenSentinelMissing() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(wordRepository.findActiveByNormalizedTerm("hi", Language.ENGLISH, DictionaryFlavor.BILINGUAL)).thenReturn(
            Optional.empty()
        );
        when(
            wordSearcher.streamSearch(
                eq("hi"),
                eq(Language.ENGLISH),
                eq(DictionaryFlavor.BILINGUAL),
                eq("doubao"),
                any()
            )
        ).thenReturn(Flux.just("{\"term\":\"hi\"}"));

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false,
            true
        );

        StepVerifier.create(flux)
            .expectNextMatches(payload -> payload.data().contains("hi") && payload.event() == null)
            .verifyComplete();
        verify(parser, never()).parse(any(), any(), any());
        verify(wordRepository, never()).save(any());
        verify(searchResultService, never()).createVersion(
            anyLong(),
            anyLong(),
            anyString(),
            any(Language.class),
            anyString(),
            anyString(),
            any(Word.class),
            any(DictionaryFlavor.class)
        );
    }

    /**
     * 测试目标：验证流式过程中出现异常时不会触发持久化。
     * 前置条件：
     *  - wordRepository.findActiveByNormalizedTerm 返回空；流式过程中抛出异常。
     * 步骤：
     *  1) 发起 streamWordForUser 并观察异常终止。
     * 断言：
     *  - 未调用 wordRepository.save、parser.parse、searchResultService.createVersion。
     * 边界/异常：
     *  - 覆盖流式中途失败的分支。
     */
    @Test
    void doesNotSaveOnError() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(wordRepository.findActiveByNormalizedTerm("hi", Language.ENGLISH, DictionaryFlavor.BILINGUAL)).thenReturn(
            Optional.empty()
        );
        when(
            wordSearcher.streamSearch(eq("hi"), eq(Language.ENGLISH), eq(DictionaryFlavor.BILINGUAL), any(), any())
        ).thenReturn(Flux.concat(Flux.just("part"), Flux.error(new RuntimeException("boom"))));

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false,
            true
        );

        StepVerifier.create(flux)
            .expectNextMatches(payload -> payload.data().equals("part") && payload.event() == null)
            .expectError()
            .verify();
        verify(wordRepository, never()).save(any());
        verify(parser, never()).parse(any(), any(), any());
        verify(searchResultService, never()).createVersion(
            anyLong(),
            anyLong(),
            anyString(),
            any(Language.class),
            anyString(),
            anyString(),
            any(Word.class),
            any(DictionaryFlavor.class)
        );
    }

    private SearchRecordResponse sampleRecordResponse(String term) {
        return new SearchRecordResponse(
            10L,
            1L,
            term,
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            LocalDateTime.now(),
            Boolean.FALSE,
            null,
            List.of()
        );
    }
}
