package com.glancy.backend.service.personalization;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.glancy.backend.dto.word.PersonalizedWordExplanation;
import com.glancy.backend.dto.word.WordPersonalizationContext;
import com.glancy.backend.dto.word.WordResponse;
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
     * 测试目标：验证个性化服务会在精简画像字段后仍能整合职业目标、兴趣与历史记录生成上下文。
     * 前置条件：
     *  - 用户画像含有高强度每日词汇目标、兴趣列表、学习目标；
     *  - 搜索历史返回两个近期词条；
     *  - 词条响应包含释义、示例与同义词。
     * 步骤：
     *  1) 通过 mock Repository 返回画像与历史；
     *  2) 调用 `resolveContext` 获取个性化上下文；
     *  3) 调用 `personalize` 构建个性化释义。
     * 断言：
     *  - Persona 源于画像且描述与每日目标策略匹配；
     *  - 兴趣、目标与历史词条被保留；
     *  - 个性化释义包含兴趣关键词、当前查询词与学习钩子。
     * 边界/异常：
     *  - 若画像缺失字段，应由服务回退到默认 Persona（此处不覆盖）。
     */
    @Test
    void personalizeMergesProfileAndHistory() {
        UserProfile profile = new UserProfile();
        profile.setDailyWordTarget(70);
        profile.setJob("产品设计师");
        profile.setInterest("金融, 设计");
        profile.setGoal("赢得国际设计奖");
        profile.setFuturePlan("打造沉浸式体验");
        profile.setResponseStyle("沉稳");
        profile.setUser(new User());
        when(userProfileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        SearchRecord first = new SearchRecord();
        first.setTerm("equity");
        first.setCreatedAt(LocalDateTime.now());
        first.setUpdatedAt(LocalDateTime.now());
        first.setDeleted(false);

        SearchRecord second = new SearchRecord();
        second.setTerm("portfolio");
        second.setCreatedAt(LocalDateTime.now().minusHours(1));
        second.setUpdatedAt(LocalDateTime.now().minusHours(1));
        second.setDeleted(false);

        when(
            searchRecordRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(eq(1L), any(Pageable.class))
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
            null,
            DictionaryFlavor.BILINGUAL
        );

        WordPersonalizationContext context = service.resolveContext(1L);
        assertNotNull(context);
        assertTrue(context.personaDerivedFromProfile());
        assertEquals("高频冲刺的进阶学习者", context.personaDescriptor());
        assertEquals("同样在冲刺高强度词汇目标的伙伴", context.audienceDescriptor());
        assertTrue(context.hasSignals());
        assertEquals("赢得国际设计奖", context.goal());
        assertEquals("沉稳", context.preferredTone());
        assertEquals(List.of("金融", "设计"), context.interests());
        assertEquals(List.of("equity", "portfolio"), context.recentTerms());

        PersonalizedWordExplanation result = service.personalize(context, response);

        assertNotNull(result);
        assertTrue(result.personaSummary().contains("金融"));
        assertTrue(result.personaSummary().contains("高频冲刺"));
        assertTrue(result.personaSummary().contains("leverage"));
        assertTrue(result.keyTakeaway().startsWith("核心释义"));
        assertTrue(result.contextualExplanation().contains("示例提示"));
        assertFalse(result.learningHooks().isEmpty());
        assertTrue(result.learningHooks().get(0).contains("equity"));
        assertEquals(2, result.reflectionPrompts().size());
        assertTrue(result.reflectionPrompts().get(1).contains("赢得国际设计奖"));
    }
}
