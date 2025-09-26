package com.glancy.backend.service.gomemo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.glancy.backend.config.GomemoProperties;
import com.glancy.backend.entity.GomemoSession;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.Word;
import com.glancy.backend.gomemo.model.GomemoPersona;
import com.glancy.backend.gomemo.model.GomemoPlanWord;
import com.glancy.backend.repository.GomemoSessionWordRepository;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.WordRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class GomemoWordPrioritizerTest {

    @Mock
    private SearchRecordRepository searchRecordRepository;

    @Mock
    private WordRepository wordRepository;

    @Mock
    private GomemoSessionWordRepository sessionWordRepository;

    private GomemoWordPrioritizer prioritizer;

    @BeforeEach
    void setUp() {
        GomemoProperties properties = new GomemoProperties();
        properties.setPlanOversamplingFactor(2);
        prioritizer = new GomemoWordPrioritizer(
            searchRecordRepository,
            wordRepository,
            sessionWordRepository,
            properties
        );
    }

    /**
     * 验证优先级算法会综合兴趣命中、收藏状态与历史检索顺位打分，并按分值降序返回。
     */
    @Test
    void shouldRankWordsUsingPersonalSignals() {
        Long userId = 1L;
        SearchRecord innovation = new SearchRecord();
        innovation.setTerm("innovation");
        innovation.setLanguage(Language.ENGLISH);
        innovation.setFavorite(true);
        SearchRecord strategy = new SearchRecord();
        strategy.setTerm("strategy");
        strategy.setLanguage(Language.ENGLISH);
        strategy.setFavorite(false);
        when(
            searchRecordRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(eq(userId), any(PageRequest.class))
        ).thenReturn(List.of(innovation, strategy));
        Word innovationWord = new Word();
        innovationWord.setTerm("innovation");
        innovationWord.setLanguage(Language.ENGLISH);
        innovationWord.setFlavor(DictionaryFlavor.BILINGUAL);
        innovationWord.setDefinitions(List.of("business innovation in design"));
        Word strategyWord = new Word();
        strategyWord.setTerm("strategy");
        strategyWord.setLanguage(Language.ENGLISH);
        strategyWord.setFlavor(DictionaryFlavor.BILINGUAL);
        strategyWord.setDefinitions(List.of("long-term corporate planning"));
        when(
            wordRepository.findByTermAndLanguageAndFlavorAndDeletedFalse(
                "innovation",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            )
        ).thenReturn(
            java.util.Optional.of(innovationWord)
        );
        when(
            wordRepository.findByTermAndLanguageAndFlavorAndDeletedFalse(
                "strategy",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            )
        ).thenReturn(
            java.util.Optional.of(strategyWord)
        );
        when(wordRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(List.of()));
        GomemoPersona persona = new GomemoPersona(
            28,
            "descriptor",
            "audience",
            "tone",
            5,
            "海外演讲",
            "国际合作",
            List.of("business")
        );

        List<GomemoPlanWord> plan = prioritizer.prioritize(userId, persona, 3);

        assertFalse(plan.isEmpty());
        assertEquals("innovation", plan.get(0).term());
        assertFalse(plan.get(0).rationales().isEmpty());
    }

    /**
     * 验证当会话已有缓存词汇时，reloadFromSession 会将持久化数据还原为计划词汇。
     */
    @Test
    void shouldReloadSessionWords() {
        GomemoSession session = new GomemoSession();
        session.setId(10L);
        com.glancy.backend.entity.GomemoSessionWord stored = new com.glancy.backend.entity.GomemoSessionWord();
        stored.setSession(session);
        stored.setTerm("resilience");
        stored.setLanguage(Language.ENGLISH);
        stored.setPriorityScore(10);
        stored.setRationales(List.of("近期检索优先复习"));
        stored.setRecommendedModes(
            new java.util.LinkedHashSet<>(List.of(com.glancy.backend.gomemo.model.GomemoStudyModeType.CARD))
        );
        when(sessionWordRepository.findBySessionIdAndDeletedFalseOrderByPriorityScoreDesc(10L)).thenReturn(
            List.of(stored)
        );

        List<GomemoPlanWord> reloaded = prioritizer.reloadFromSession(10L);

        assertEquals(1, reloaded.size());
        assertEquals("resilience", reloaded.get(0).term());
    }
}
