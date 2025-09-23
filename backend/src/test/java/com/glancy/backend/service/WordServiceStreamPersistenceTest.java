package com.glancy.backend.service;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        wordService = new WordService(
            wordSearcher,
            wordRepository,
            userPreferenceRepository,
            searchRecordService,
            searchResultService,
            parser
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
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("cached", Language.ENGLISH)).thenReturn(
            Optional.of(word)
        );
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(
            new SearchRecordResponse(5L, 1L, "cached", Language.ENGLISH, LocalDateTime.now(), false, null)
        );
        SearchResultVersion version = new SearchResultVersion();
        version.setId(9L);
        when(searchResultService.recordVersion(any())).thenReturn(version);

        WordService.WordStreamResult result = wordService.streamWordForUser(
            1L,
            "cached",
            Language.ENGLISH,
            null,
            false
        );

        StepVerifier.create(result.payload())
            .expectNextMatches(s -> s.contains("cached"))
            .verifyComplete();
        StepVerifier.create(result.versionId()).expectNext(9L).verifyComplete();
        verify(wordSearcher, never()).streamSearch(any(), any(), any());
        verify(searchResultService).recordVersion(any());
    }

    /** 验证流式结束后会持久化。 */
    @Test
    void savesAfterStreaming() {
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
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(
            new SearchRecordResponse(7L, 1L, "hi", Language.ENGLISH, LocalDateTime.now(), false, null)
        );
        SearchResultVersion version = new SearchResultVersion();
        version.setId(11L);
        when(searchResultService.recordVersion(any())).thenReturn(version);

        WordService.WordStreamResult result = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            null,
            false
        );

        StepVerifier.create(result.payload()).expectNext("{\"term\":\"hi\"}").expectNext("<END>").verifyComplete();
        StepVerifier.create(result.versionId()).expectNext(11L).verifyComplete();
        verify(wordRepository).save(argThat(w -> "{\"term\":\"hi\"}".equals(w.getMarkdown())));
        verify(searchResultService, atLeastOnce()).recordVersion(any());
    }

    /** 验证缺少哨兵时不会解析或持久化，等待上游补齐。 */
    @Test
    void skipPersistenceWhenSentinelMissing() {
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("hi", Language.ENGLISH)).thenReturn(Optional.empty());
        when(wordSearcher.streamSearch("hi", Language.ENGLISH, null)).thenReturn(Flux.just("{\"term\":\"hi\"}"));
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(
            new SearchRecordResponse(8L, 1L, "hi", Language.ENGLISH, LocalDateTime.now(), false, null)
        );

        WordService.WordStreamResult result = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            null,
            false
        );

        StepVerifier.create(result.payload()).expectNext("{\"term\":\"hi\"}").verifyComplete();
        StepVerifier.create(result.versionId()).verifyComplete();
        verify(parser, never()).parse(any(), any(), any());
        verify(wordRepository, never()).save(any());
        verify(searchResultService, never()).recordVersion(any());
    }

    /** 验证异常时不会写库。 */
    @Test
    void doesNotSaveOnError() {
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("hi", Language.ENGLISH)).thenReturn(Optional.empty());
        when(wordSearcher.streamSearch("hi", Language.ENGLISH, null)).thenReturn(
            Flux.concat(Flux.just("part"), Flux.error(new RuntimeException("boom")))
        );
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(
            new SearchRecordResponse(6L, 1L, "hi", Language.ENGLISH, LocalDateTime.now(), false, null)
        );

        WordService.WordStreamResult result = wordService.streamWordForUser(
            1L,
            "hi",
            Language.ENGLISH,
            null,
            false
        );

        StepVerifier.create(result.payload()).expectNext("part").expectError().verify();
        StepVerifier.create(result.versionId()).expectError().verify();
        verify(wordRepository, never()).save(any());
        verify(parser, never()).parse(any(), any(), any());
        verify(searchResultService, never()).recordVersion(any());
    }
}
