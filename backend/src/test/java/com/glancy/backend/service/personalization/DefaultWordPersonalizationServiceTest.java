package com.glancy.backend.service.personalization;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserProfile;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.UserProfileRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new DefaultWordPersonalizationService(userProfileRepository, searchRecordRepository);
    }

    /**
     * 验证个性化服务会整合用户画像、兴趣与历史记录生成完整叙述。
     */
    @Test
    void personalizeMergesProfileAndHistory() {
        UserProfile profile = new UserProfile();
        profile.setAge(29);
        profile.setGender("女");
        profile.setInterest("金融, 设计");
        profile.setGoal("通过商务演讲展示专业度");
        profile.setUser(new User());
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        SearchRecord first = new SearchRecord();
        first.setTerm("equity");
        first.setCreatedAt(LocalDateTime.now());
        first.setDeleted(false);

        SearchRecord second = new SearchRecord();
        second.setTerm("portfolio");
        second.setCreatedAt(LocalDateTime.now().minusHours(1));
        second.setDeleted(false);

        when(
            searchRecordRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(eq(1L), any(Pageable.class))
        ).thenReturn(List.of(first, second));

        WordResponse response = new WordResponse(
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
            null
        );

        WordPersonalizationContext context = service.resolveContext(1L);
        assertNotNull(context);
        assertTrue(context.personaDerivedFromProfile());
        assertEquals("自驱力强的青年进阶者", context.personaDescriptor());
        assertEquals("大学或初入职场的伙伴", context.audienceDescriptor());
        assertTrue(context.hasSignals());
        assertEquals("通过商务演讲展示专业度", context.goal());
        assertEquals("柔和而坚定", context.preferredTone());
        assertEquals(List.of("金融", "设计"), context.interests());
        assertEquals(List.of("equity", "portfolio"), context.recentTerms());

        PersonalizedWordExplanation result = service.personalize(context, response);

        assertNotNull(result);
        assertTrue(result.personaSummary().contains("金融"));
        assertTrue(result.personaSummary().contains("leverage"));
        assertTrue(result.keyTakeaway().startsWith("核心释义"));
        assertTrue(result.contextualExplanation().contains("示例提示"));
        assertFalse(result.learningHooks().isEmpty());
        assertTrue(result.learningHooks().get(0).contains("equity"));
        assertEquals(2, result.reflectionPrompts().size());
        assertTrue(result.reflectionPrompts().get(1).contains("商务演讲"));
    }
}
