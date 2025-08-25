package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.glancy.backend.client.DictionaryClient;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.WordRepository;
import java.util.List;
import java.util.Optional;
import org.mockito.ArgumentCaptor;
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
    private DictionaryClient dictionaryClient;

    @Mock
    private WordSearcher wordSearcher;

    @Mock
    private WordRepository wordRepository;

    @Mock
    private UserPreferenceRepository userPreferenceRepository;

    @Mock
    private SearchRecordService searchRecordService;

    @Mock
    private WordResponseParser parser;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        wordService = new WordService(
            dictionaryClient,
            wordSearcher,
            wordRepository,
            userPreferenceRepository,
            searchRecordService,
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
        word.setMarkdown("# cached\n\n- def");
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("cached", Language.ENGLISH)).thenReturn(
            Optional.of(word)
        );

        Flux<String> flux = wordService.streamWordForUser(1L, "cached", Language.ENGLISH, null);

        StepVerifier.create(flux)
            .expectNextMatches(s -> s.contains("cached") && s.contains("# cached"))
            .verifyComplete();
        verify(wordSearcher, never()).streamSearch(any(), any(), any());
    }

    /** 验证流式结束后会持久化。 */
    @Test
    void savesAfterStreaming() {
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("hi", Language.ENGLISH)).thenReturn(Optional.empty());
        when(wordSearcher.streamSearch("hi", Language.ENGLISH, null)).thenReturn(Flux.just("{\"term\":\"hi\"}", ""));
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
            "{\"term\":\"hi\"}"
        );
        when(parser.parse("{\"term\":\"hi\"}", "hi", Language.ENGLISH)).thenReturn(resp);
        when(wordRepository.save(any())).thenAnswer(invocation -> {
                Word w = invocation.getArgument(0);
                w.setId(1L);
                return w;
            });

        Flux<String> flux = wordService.streamWordForUser(1L, "hi", Language.ENGLISH, null);

        StepVerifier.create(flux).expectNext("{\"term\":\"hi\"}").expectNext("\"").verifyComplete();
        ArgumentCaptor<Word> captor = ArgumentCaptor.forClass(Word.class);
        verify(wordRepository).save(captor.capture());
        assertEquals("{\"term\":\"hi\"}", captor.getValue().getMarkdown());
    }

    /** 验证异常时不会写库。 */
    @Test
    void doesNotSaveOnError() {
        when(wordRepository.findByTermAndLanguageAndDeletedFalse("hi", Language.ENGLISH)).thenReturn(Optional.empty());
        when(wordSearcher.streamSearch("hi", Language.ENGLISH, null)).thenReturn(
            Flux.concat(Flux.just("part"), Flux.error(new RuntimeException("boom")))
        );

        Flux<String> flux = wordService.streamWordForUser(1L, "hi", Language.ENGLISH, null);

        StepVerifier.create(flux).expectNext("part").expectError().verify();
        verify(wordRepository, never()).save(any());
        verify(parser, never()).parse(any(), any(), any());
    }
}
