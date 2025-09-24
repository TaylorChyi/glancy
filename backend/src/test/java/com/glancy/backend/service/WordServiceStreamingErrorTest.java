package com.glancy.backend.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import java.time.LocalDateTime;
import java.util.List;
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

    @Test
    void wrapsExceptionFromSearcher() {
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecordResponse());
        when(wordSearcher.streamSearch(any(), any(), any())).thenThrow(new RuntimeException("boom"));
        Flux<WordService.StreamPayload> result = wordService.streamWordForUser(
            1L,
            "hello",
            Language.ENGLISH,
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
            LocalDateTime.now(),
            Boolean.FALSE,
            null,
            List.of()
        );
    }
}
