package com.glancy.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

/**
 * WordService 查词流程的同步路径单测，覆盖缓存与强制刷新逻辑。
 */
class WordServiceLookupPipelineTest {

    private WordService wordService;
    private WordLookupCoordinator lookupCoordinator;

    @Mock
    private WordSearcher wordSearcher;

    @Mock
    private WordRepository wordRepository;

    @Mock
    private SearchRecordService searchRecordService;

    @Mock
    private SearchResultService searchResultService;

    @Mock
    private WordPersonalizationService wordPersonalizationService;

    @Mock
    private WordResponseParser parser;

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
        wordService = new WordService(
            lookupCoordinator,
            new WordStreamingHandler(wordSearcher, parser, lookupCoordinator)
        );
    }

    /**
     * 步骤：
     * 1. 构造缓存命中场景。
     * 2. 调用 findWordForUser 并验证不会触发远端查询。
     */
    @Test
    void returnsCachedWordWhenAvailable() {
        Word cached = new Word();
        cached.setId(99L);
        cached.setTerm("cache");
        cached.setLanguage(Language.ENGLISH);
        cached.setFlavor(DictionaryFlavor.BILINGUAL);
        cached.setMarkdown("md");
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecord("cache"));
        when(
            wordRepository.findByTermAndLanguageAndFlavorAndDeletedFalse(
                "cache",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            )
        ).thenReturn(Optional.of(cached));

        WordResponse response = wordService.findWordForUser(
            1L,
            "cache",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            false
        );

        assertThat(response.getId()).isEqualTo("99");
        verify(wordSearcher, never()).search(any(), any(), any(), any(), any());
    }

    /**
     * 步骤：
     * 1. 构造缓存存在但设置 forceNew=true 的场景。
     * 2. 断言依然会触发远端查询并写入版本信息。
     */
    @Test
    void forcesRemoteLookupWhenRequested() {
        Word existing = new Word();
        existing.setId(66L);
        existing.setTerm("force");
        existing.setLanguage(Language.ENGLISH);
        existing.setFlavor(DictionaryFlavor.BILINGUAL);
        existing.setMarkdown("old");
        when(searchRecordService.saveRecord(eq(1L), any())).thenReturn(sampleRecord("force"));
        when(
            wordRepository.findByTermAndLanguageAndFlavorAndDeletedFalse(
                anyString(),
                any(Language.class),
                any(DictionaryFlavor.class)
            )
        ).thenReturn(Optional.of(existing));
        WordResponse remote = new WordResponse(
            null,
            "force",
            List.of("def"),
            Language.ENGLISH,
            null,
            null,
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            "markdown",
            null,
            null,
            DictionaryFlavor.BILINGUAL
        );
        when(
            wordSearcher.search(eq("force"), eq(Language.ENGLISH), eq(DictionaryFlavor.BILINGUAL), eq("doubao"), any())
        ).thenReturn(remote);
        when(wordRepository.save(any())).thenAnswer(invocation -> {
                Word word = invocation.getArgument(0);
                word.setId(101L);
                return word;
            });
        SearchResultVersion version = new SearchResultVersion();
        version.setId(55L);
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

        WordResponse response = wordService.findWordForUser(
            1L,
            "force",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            null,
            true
        );

        verify(wordSearcher).search(any(), any(), any(), any(), any());
        verify(wordRepository).save(any(Word.class));
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
        assertThat(response.getVersionId()).isEqualTo(55L);
        assertThat(response.getId()).isEqualTo("101");
    }

    private SearchRecordResponse sampleRecord(String term) {
        return new SearchRecordResponse(
            30L,
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
