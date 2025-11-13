package com.glancy.backend.service.personalization;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserProfile;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.UserProfileRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Pageable;

class DefaultWordPersonalizationServiceTest {

    private DefaultWordPersonalizationService service;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private SearchRecordRepository searchRecordRepository;

    private PersonalizationNarrativeBuilder narrativeBuilder;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        narrativeBuilder = new PersonalizationNarrativeBuilder();
        service =
                new DefaultWordPersonalizationService(userProfileRepository, searchRecordRepository, narrativeBuilder);
    }

    @Test
    void resolveContextMergesProfileSignals() {
        mockProfile();
        mockHistory();

        WordPersonalizationContext context = service.resolveContext(1L);

        Assertions.assertTrue(context.personaDerivedFromProfile());
        Assertions.assertEquals("高频冲刺的进阶学习者", context.personaDescriptor());
        Assertions.assertEquals("同样在冲刺高强度词汇目标的伙伴", context.audienceDescriptor());
        Assertions.assertTrue(context.hasSignals());
        Assertions.assertEquals("赢得国际设计奖", context.goal());
        Assertions.assertEquals("沉稳", context.preferredTone());
        Assertions.assertEquals(List.of("金融", "设计"), context.interests());
    }

    @Test
    void personalizeCombinesHistorySignals() {
        mockProfile();
        mockHistory();
        WordPersonalizationContext context = service.resolveContext(1L);

        PersonalizedWordExplanation result = service.personalize(context, sampleResponse());

        Assertions.assertTrue(result.personaSummary().contains("金融"));
        Assertions.assertTrue(result.personaSummary().contains("高频冲刺"));
        Assertions.assertTrue(result.personaSummary().contains("leverage"));
        Assertions.assertFalse(result.learningHooks().isEmpty());
        Assertions.assertEquals(List.of("equity", "portfolio"), context.recentTerms());
        Assertions.assertTrue(result.learningHooks().get(0).contains("equity"));
        Assertions.assertEquals(2, result.reflectionPrompts().size());
        Assertions.assertTrue(result.reflectionPrompts().get(1).contains("赢得国际设计奖"));
    }

    private void mockProfile() {
        UserProfile profile = new UserProfile();
        profile.setDailyWordTarget(70);
        profile.setJob("产品设计师");
        profile.setInterest("金融, 设计");
        profile.setGoal("赢得国际设计奖");
        profile.setFuturePlan("打造沉浸式体验");
        profile.setResponseStyle("沉稳");
        profile.setUser(new User());
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
    }

    private void mockHistory() {
        SearchRecord first = record("equity", LocalDateTime.now());
        SearchRecord second = record("portfolio", LocalDateTime.now().minusHours(1));
        when(searchRecordRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(List.of(first, second));
    }

    private SearchRecord record(String term, LocalDateTime timestamp) {
        SearchRecord record = new SearchRecord();
        record.setTerm(term);
        record.setCreatedAt(timestamp);
        record.setUpdatedAt(timestamp);
        record.setDeleted(false);
        return record;
    }

    private WordResponse sampleResponse() {
        return new WordResponse(
                "10",
                "leverage",
                List.of("to use borrowed capital to increase the potential return"),
                Language.ENGLISH,
                "She leveraged the market trend to accelerate growth.",
                "ˈlev(ə)rij",
                List.of(),
                List.of("utilize"),
                List.of("neglect"),
                List.of(),
                List.of("financial leverage"),
                "# leverage",
                null,
                null,
                DictionaryFlavor.BILINGUAL);
    }
}
