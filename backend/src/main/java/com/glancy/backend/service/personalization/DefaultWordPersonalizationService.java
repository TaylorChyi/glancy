package com.glancy.backend.service.personalization;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.UserProfile;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.UserProfileRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 背景：
 *  - 画像字段裁剪后，词汇个性化仍需根据有限画像与搜索轨迹推导 Persona，以驱动 LLM 生成侧文案。
 * 目的：
 *  - 聚合用户画像、搜索历史与词条响应，生成个性化语境与行动建议。
 * 关键决策与取舍：
 *  - 采用责任链 + 策略混合模型：`PERSONA_CLASSIFIERS` 以先匹配先返回的顺序判定 Persona，便于按需扩展；
 *  - 将文本拼装逻辑拆分为若干私有方法，确保可读性并便于未来引入多语言支持；
 *  - 对兴趣字段使用不可变集合与去重策略，避免重复朗读。
 * 影响范围：
 *  - 影响偏好设置与解释生成流程中依赖的个性化上下文。
 * 演进与TODO：
 *  - TODO: 后续可引入外部特征（如学习进度），通过新增 `PersonaClassifier` 实现扩展链路。
 */
@Service
public class DefaultWordPersonalizationService implements WordPersonalizationService {

    private static final int RECENT_HISTORY_LIMIT = 5;
    private static final int HOOK_LIMIT = 3;
    private static final Pattern INTEREST_SPLITTER = Pattern.compile("[,，;；/\\\\]+");
    private static final int DAILY_TARGET_SPRINT = 60;
    private static final int DAILY_TARGET_PROGRESSIVE = 30;
    private static final List<PersonaClassifier> PERSONA_CLASSIFIERS = List.of(
        new DailyTargetPersonaClassifier(),
        new JobPersonaClassifier(),
        new GoalPersonaClassifier()
    );

    private final UserProfileRepository userProfileRepository;
    private final SearchRecordRepository searchRecordRepository;

    public DefaultWordPersonalizationService(
        UserProfileRepository userProfileRepository,
        SearchRecordRepository searchRecordRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.searchRecordRepository = searchRecordRepository;
    }

    @Override
    public WordPersonalizationContext resolveContext(Long userId) {
        Optional<UserProfile> profile = userProfileRepository.findByUserId(userId);
        PersonaProfile personaProfile = resolvePersonaProfile(profile);
        String goal = profile.map(UserProfile::getGoal).map(this::normalizeText).orElse(null);
        List<String> interests = profile.map(UserProfile::getInterest).map(this::parseInterests).orElseGet(List::of);
        String responseStyle = profile
            .map(UserProfile::getResponseStyle)
            .map(this::normalizeText)
            .filter(StringUtils::hasText)
            .orElse(null);
        List<String> recentTerms = fetchRecentTerms(userId);
        return new WordPersonalizationContext(
            personaProfile.descriptor(),
            personaProfile.derivedFromProfile(),
            personaProfile.audience(),
            goal,
            responseStyle != null ? responseStyle : personaProfile.preferredTone(),
            interests,
            recentTerms
        );
    }

    private PersonaProfile resolvePersonaProfile(Optional<UserProfile> profile) {
        PersonaInput input = profile.map(this::toPersonaInput).orElse(PersonaInput.empty());
        for (PersonaClassifier classifier : PERSONA_CLASSIFIERS) {
            Optional<PersonaProfile> persona = classifier.classify(input);
            if (persona.isPresent()) {
                return persona.get();
            }
        }
        return PersonaProfile.fallback();
    }

    private PersonaInput toPersonaInput(UserProfile profile) {
        return new PersonaInput(
            normalizeText(profile.getJob()),
            profile.getDailyWordTarget(),
            normalizeText(profile.getGoal()),
            normalizeText(profile.getFuturePlan())
        );
    }

    @Override
    public PersonalizedWordExplanation personalize(WordPersonalizationContext context, WordResponse response) {
        PersonaProfile fallbackPersona = PersonaProfile.fallback();
        WordPersonalizationContext effectiveContext = context != null
            ? context
            : new WordPersonalizationContext(
                fallbackPersona.descriptor(),
                false,
                fallbackPersona.audience(),
                null,
                fallbackPersona.preferredTone(),
                List.of(),
                List.of()
            );
        return composeExplanation(effectiveContext, response);
    }

    private List<String> fetchRecentTerms(Long userId) {
        List<SearchRecord> records = searchRecordRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(
            userId,
            PageRequest.of(0, RECENT_HISTORY_LIMIT)
        );
        if (records.isEmpty()) {
            return List.of();
        }
        Set<String> deduplicated = new LinkedHashSet<>();
        for (SearchRecord record : records) {
            String term = normalizeText(record.getTerm());
            if (term != null) {
                deduplicated.add(term);
            }
            if (deduplicated.size() >= RECENT_HISTORY_LIMIT) {
                break;
            }
        }
        return List.copyOf(deduplicated);
    }

    private PersonalizedWordExplanation composeExplanation(WordPersonalizationContext context, WordResponse response) {
        String personaSummary = buildPersonaSummary(context, response);
        String keyTakeaway = buildKeyTakeaway(response);
        String contextualExplanation = buildContextualExplanation(context, response);
        List<String> hooks = buildLearningHooks(context, response);
        List<String> prompts = buildReflectionPrompts(context, response);
        return new PersonalizedWordExplanation(personaSummary, keyTakeaway, contextualExplanation, hooks, prompts);
    }

    private String buildPersonaSummary(WordPersonalizationContext context, WordResponse response) {
        StringBuilder builder = new StringBuilder(context.personaDescriptor());
        if (!context.interests().isEmpty()) {
            builder
                .append("，关注")
                .append(
                    String.join("、", context.interests().subList(0, Math.min(context.interests().size(), HOOK_LIMIT)))
                );
        }
        if (StringUtils.hasText(context.goal())) {
            builder.append("，正在为了").append(context.goal()).append("努力");
        }
        if (StringUtils.hasText(context.preferredTone())) {
            builder.append("。偏好语气：").append(context.preferredTone());
        }
        if (StringUtils.hasText(response.getTerm())) {
            builder.append("。本次聚焦词汇：").append(response.getTerm());
        }
        return builder.toString();
    }

    private String buildKeyTakeaway(WordResponse response) {
        String primaryDefinition = response.getDefinitions() != null && !response.getDefinitions().isEmpty()
            ? response.getDefinitions().get(0)
            : null;
        if (StringUtils.hasText(primaryDefinition)) {
            return "核心释义：" + primaryDefinition;
        }
        if (StringUtils.hasText(response.getMarkdown())) {
            return "核心释义：结合生成的说明重点理解关键词与例句。";
        }
        return "核心释义：该词条暂无结构化定义，请结合上下文理解。";
    }

    private String buildContextualExplanation(WordPersonalizationContext context, WordResponse response) {
        StringBuilder builder = new StringBuilder();
        if (!context.interests().isEmpty()) {
            builder
                .append("将其代入你关心的")
                .append(
                    String.join("、", context.interests().subList(0, Math.min(context.interests().size(), HOOK_LIMIT)))
                )
                .append("场景，更容易感知语感差异。");
        } else {
            builder.append("结合你熟悉的生活或工作片段，构建专属语境。 ");
        }

        if (StringUtils.hasText(response.getExample())) {
            builder
                .append("示例提示：")
                .append(trimExample(response.getExample()))
                .append("。试着改写成与目标相关的句子。");
        } else if (response.getPhrases() != null && !response.getPhrases().isEmpty()) {
            builder
                .append("可以从常见词组如")
                .append(
                    String.join(
                        "、",
                        response.getPhrases().subList(0, Math.min(response.getPhrases().size(), HOOK_LIMIT))
                    )
                )
                .append("入手体会语义层次。");
        }
        return builder.toString();
    }

    private List<String> buildLearningHooks(WordPersonalizationContext context, WordResponse response) {
        List<String> hooks = new ArrayList<>();
        if (!context.recentTerms().isEmpty() && StringUtils.hasText(response.getTerm())) {
            String related = context
                .recentTerms()
                .stream()
                .filter(term -> !term.equalsIgnoreCase(response.getTerm()))
                .limit(HOOK_LIMIT)
                .collect(Collectors.joining("、"));
            if (StringUtils.hasText(related)) {
                hooks.add("与最近查阅的" + related + "对比，梳理语义边界。");
            }
        }

        if (response.getSynonyms() != null && !response.getSynonyms().isEmpty()) {
            hooks.add(
                "同义词提示：" +
                response.getSynonyms().stream().limit(HOOK_LIMIT).collect(Collectors.joining("、")) +
                "，尝试写出差异化例句。"
            );
        }

        if (response.getAntonyms() != null && !response.getAntonyms().isEmpty()) {
            hooks.add(
                "反义词提示：" +
                response.getAntonyms().stream().limit(HOOK_LIMIT).collect(Collectors.joining("、")) +
                "，帮助构建对立语境。"
            );
        }

        if (hooks.isEmpty()) {
            hooks.add("将该词写入今日的学习清单，并尝试与目标任务结合。");
        }
        return List.copyOf(hooks);
    }

    private List<String> buildReflectionPrompts(WordPersonalizationContext context, WordResponse response) {
        List<String> prompts = new ArrayList<>();
        String term = Optional.ofNullable(response.getTerm()).filter(StringUtils::hasText).orElse("该词");
        prompts.add("如果向一位" + context.audienceDescriptor() + "解释" + term + "，你会怎么说？");
        if (StringUtils.hasText(context.goal())) {
            prompts.add("这个词如何帮助你更接近" + context.goal() + "？尝试写下行动计划。");
        } else {
            prompts.add("想象在下次交流中使用该词，提前准备一句自然的表达。");
        }
        return List.copyOf(prompts);
    }

    private String trimExample(String example) {
        String normalized = example.replaceAll("\n+", " ").trim();
        if (normalized.length() <= 60) {
            return normalized;
        }
        return normalized.substring(0, 57) + "...";
    }

    private String normalizeText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> parseInterests(String interestText) {
        String normalized = normalizeText(interestText);
        if (normalized == null) {
            return List.of();
        }
        String[] tokens = INTEREST_SPLITTER.split(normalized);
        List<String> interests = new ArrayList<>();
        for (String token : tokens) {
            String value = normalizeText(token);
            if (value != null) {
                interests.add(value);
            }
        }
        if (interests.isEmpty()) {
            return List.of();
        }
        return Collections.unmodifiableList(interests);
    }

    private record PersonaInput(String job, Integer dailyWordTarget, String goal, String futurePlan) {
        static PersonaInput empty() {
            return new PersonaInput(null, null, null, null);
        }
    }

    private record PersonaProfile(
        String descriptor,
        String audience,
        String preferredTone,
        boolean derivedFromProfile
    ) {
        PersonaProfile {
            descriptor = normalizeField(descriptor, "保持好奇的学习者");
            audience = normalizeField(audience, "身边的朋友");
            preferredTone = normalizeField(preferredTone, "温和而自信");
        }

        private static String normalizeField(String candidate, String fallback) {
            return StringUtils.hasText(candidate) ? candidate.trim() : fallback;
        }

        static PersonaProfile fallback() {
            return new PersonaProfile("保持好奇的学习者", "身边的朋友", "温和而自信", false);
        }
    }

    private interface PersonaClassifier {
        Optional<PersonaProfile> classify(PersonaInput input);
    }

    private static final class DailyTargetPersonaClassifier implements PersonaClassifier {

        @Override
        public Optional<PersonaProfile> classify(PersonaInput input) {
            Integer target = input.dailyWordTarget();
            if (target == null || target <= 0) {
                return Optional.empty();
            }
            if (target >= DAILY_TARGET_SPRINT) {
                return Optional.of(
                    new PersonaProfile("高频冲刺的进阶学习者", "同样在冲刺高强度词汇目标的伙伴", "节奏明快", true)
                );
            }
            if (target >= DAILY_TARGET_PROGRESSIVE) {
                return Optional.of(new PersonaProfile("稳步进阶的自律学习者", "坚持每日积累的同伴", "条理清晰", true));
            }
            return Optional.of(new PersonaProfile("节奏分明的词汇积累者", "循序渐进的学习伙伴", "温和坚定", true));
        }
    }

    private static final class JobPersonaClassifier implements PersonaClassifier {

        @Override
        public Optional<PersonaProfile> classify(PersonaInput input) {
            String job = input.job();
            if (!StringUtils.hasText(job)) {
                return Optional.empty();
            }
            String normalized = job.toLowerCase(Locale.ROOT);
            if (normalized.contains("学生") || normalized.contains("student")) {
                return Optional.of(new PersonaProfile("专注进阶的校园学习者", "同班同学", "亲切易懂", true));
            }
            if (normalized.contains("老师") || normalized.contains("教师") || normalized.contains("teacher")) {
                return Optional.of(new PersonaProfile("经验分享型的教育者", "课堂上的学员", "严谨清晰", true));
            }
            if (normalized.contains("工程") || normalized.contains("engineer") || normalized.contains("开发")) {
                return Optional.of(new PersonaProfile("注重逻辑的工程实践者", "协作的技术同事", "结构化且高效", true));
            }
            if (normalized.contains("设计") || normalized.contains("design")) {
                return Optional.of(new PersonaProfile("敏锐的设计探索者", "创意共创的伙伴", "细腻而感性", true));
            }
            String descriptor = job + "领域的持续学习者";
            String audience = "同行的" + job + "伙伴";
            return Optional.of(new PersonaProfile(descriptor, audience, "专业稳重", true));
        }
    }

    private static final class GoalPersonaClassifier implements PersonaClassifier {

        @Override
        public Optional<PersonaProfile> classify(PersonaInput input) {
            String goal = StringUtils.hasText(input.goal()) ? input.goal() : input.futurePlan();
            if (!StringUtils.hasText(goal)) {
                return Optional.empty();
            }
            String trimmed = goal.trim();
            return Optional.of(
                new PersonaProfile("以" + trimmed + "为目标的进阶者", "同样专注" + trimmed + "的伙伴", "鼓舞人心", true)
            );
        }
    }
}
