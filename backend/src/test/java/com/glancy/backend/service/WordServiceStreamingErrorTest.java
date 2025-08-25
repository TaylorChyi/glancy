package com.glancy.backend.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.glancy.backend.client.DictionaryClient;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.WordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

/**
 * 验证 streamWordForUser 在出现异常时会封装 IllegalStateException。
 */
class WordServiceStreamingErrorTest {

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

    @Test
    void wrapsExceptionFromSearcher() {
        when(wordSearcher.streamSearch(any(), any(), any())).thenThrow(new RuntimeException("boom"));
        Flux<String> result = wordService.streamWordForUser(1L, "hello", Language.ENGLISH, null);
        StepVerifier.create(result)
            .expectErrorMatches(e -> e instanceof IllegalStateException && e.getMessage().contains("boom"))
            .verify();
    }
}
