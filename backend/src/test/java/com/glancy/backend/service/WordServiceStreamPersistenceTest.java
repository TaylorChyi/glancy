package com.glancy.backend.service;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.WordRepository;
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

    @Mock
    private WordSearcher wordSearcher;

    @Mock
    private WordRepository wordRepository;

    @Mock
    private UserPreferenceRepository userPreferenceRepository;

    @Mock
    private SearchRecordService searchRecordService;

    @Mock
    private SearchResultService searchResultService;

    @Mock
    private WordResponseParser parser;

    @Mock
    private WordPersonalizationService wordPersonalizationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(wordPersonalizationService.personalize(anyLong(), any())).thenReturn(
            new PersonalizedWordExplanation("persona", "key", "context", List.of(), List.of())
        );
        wordService = new WordService(
            wordSearcher,
            wordRepository,
            userPreferenceRepository,
            searchRecordService,
            searchResultService,
            parser,
            wordPersonalizationService
        );
    }

    /** 验证已缓存词条时不调用模型。 */
    @Test
    void returnsCachedWord() {
        Word word = new Word();
        word.setId(1L);
        word.setTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setDefinitions(List.of("def"));
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("cached"));
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("cached", Language.ENGLISH)).thenReturn(
            Optional.of(word)
        );

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(
            1L,
            "cached",
            Language.ENGLISH,
            null,
            false
        );

        StepVerifier.create(flux)
            .expectNextMatches(payload -> payload.data().contains("cached") && payload.event() == null)
            .verifyComplete();
        verify(wordSearcher, never()).streamSearch(any(), any(), any());
        verify(searchRecordService).saveRecord(eq(1L), any());
    }

    /** 验证流式结束后会持久化。 */
    @Test
    void savesAfterStreaming() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("hi", Language.ENGLISH)).thenReturn(Optional.empty());
        when(wordSearcher.streamSearch("hi", Language.ENGLISH, null)).thenReturn(
            Flux.just("{\"term\":\"hi\"}", "<END>")
        );
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
            null
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
                any(Word.class)
            )
        ).thenReturn(version);

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(1L, "hi", Language.ENGLISH, null, false);

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
            any(Word.class)
        );
    }

    /** 验证缺少哨兵时不会解析或持久化，等待上游补齐。 */
    @Test
    void skipPersistenceWhenSentinelMissing() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("hi", Language.ENGLISH)).thenReturn(Optional.empty());
        when(wordSearcher.streamSearch("hi", Language.ENGLISH, null)).thenReturn(Flux.just("{\"term\":\"hi\"}"));

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(1L, "hi", Language.ENGLISH, null, false);

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
            any(Word.class)
        );
    }

    /** 验证异常时不会写库。 */
    @Test
    void doesNotSaveOnError() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse("hi"));
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("hi", Language.ENGLISH)).thenReturn(Optional.empty());
        when(wordSearcher.streamSearch("hi", Language.ENGLISH, null)).thenReturn(
            Flux.concat(Flux.just("part"), Flux.error(new RuntimeException("boom")))
        );

        Flux<WordService.StreamPayload> flux = wordService.streamWordForUser(1L, "hi", Language.ENGLISH, null, false);

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
            any(Word.class)
        );
    }

    private SearchRecordResponse sampleRecordResponse(String term) {
        return new SearchRecordResponse(
            10L,
            1L,
            term,
            Language.ENGLISH,
            LocalDateTime.now(),
            Boolean.FALSE,
            null,
            List.of()
        );
    }
}
