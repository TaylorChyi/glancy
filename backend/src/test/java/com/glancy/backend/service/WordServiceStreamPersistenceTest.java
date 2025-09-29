package com.glancy.backend.service;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.StreamPayload;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

/**
 * WordService streamWordForUser 相关行为测试。
 */
class WordServiceStreamPersistenceTest {

    private WordService wordService;
    private WordLookupCoordinator lookupCoordinator;
    private WordStreamingHandler streamingHandler;

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
        lookupCoordinator = new WordLookupCoordinator(
            wordSearcher,
            wordRepository,
            searchRecordService,
            searchResultService,
            wordPersonalizationService
        );
        streamingHandler = new WordStreamingHandler(wordSearcher, parser, lookupCoordinator);
        wordService = new WordService(lookupCoordinator, streamingHandler);
    }

    /** 验证已缓存词条时不调用模型。 */
    @Test
    void returnsCachedWord() {
        Word word = new Word();
        word.setId(1L);
        word.setTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("def"));
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("cached"));
        when(
            wordRepository.findByTermAndLanguageAndFlavorAndDeletedFalse(
                "cached",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            )
        ).thenReturn(Optional.of(word));

        Flux<StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "cached",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
        );

        StepVerifier.create(flux)
            .expectNextMatches(payload -> payload.data().contains("cached") && payload.event() == null)
            .verifyComplete();
        verify(wordSearcher, never()).streamSearch(any(), any(), any(), any(), any());
        verify(searchRecordService).saveRecord(eq(1L), any());
    }

    /** 验证流式结束后会持久化。 */
    @Test
    void savesAfterStreaming() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(
            wordRepository.findByTermAndLanguageAndFlavorAndDeletedFalse(
                "hi",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            )
        ).thenReturn(Optional.empty());
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

        Flux<StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
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
    }

    /** 验证缺少哨兵时不会解析或持久化，等待上游补齐。 */
    @Test
    void skipPersistenceWhenSentinelMissing() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(
            wordRepository.findByTermAndLanguageAndFlavorAndDeletedFalse(
                "hi",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            )
        ).thenReturn(Optional.empty());
        when(
            wordSearcher.streamSearch(
                eq("hi"),
                eq(Language.ENGLISH),
                eq(DictionaryFlavor.BILINGUAL),
                eq("doubao"),
                any()
            )
        ).thenReturn(Flux.just("{\"term\":\"hi\"}"));

        Flux<StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
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

    /** 验证异常时不会写库。 */
    @Test
    void doesNotSaveOnError() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(
            wordRepository.findByTermAndLanguageAndFlavorAndDeletedFalse(
                "hi",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            )
        ).thenReturn(Optional.empty());
        when(
            wordSearcher.streamSearch(eq("hi"), eq(Language.ENGLISH), eq(DictionaryFlavor.BILINGUAL), any(), any())
        ).thenReturn(Flux.concat(Flux.just("part"), Flux.error(new RuntimeException("boom"))));

        Flux<StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
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
