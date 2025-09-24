package com.glancy.backend.service.personalization;

import com.glancy.backend.dto.PersonalizedWordExplanation;
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

@Service
public class DefaultWordPersonalizationService implements WordPersonalizationService {

    private static final int RECENT_HISTORY_LIMIT = 5;
    private static final int HOOK_LIMIT = 3;
    private static final Pattern INTEREST_SPLITTER = Pattern.compile("[,，;；/\\\\]+");
    private static final int AGE_CHILD_MAX = 12;
    private static final int AGE_TEEN_MAX = 18;
    private static final int AGE_YOUNG_ADULT_MAX = 30;
    private static final int AGE_ADULT_MAX = 55;

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
    public PersonalizedWordExplanation personalize(Long userId, WordResponse response) {
        PersonalizationContext context = buildContext(userId);
        return composeExplanation(context, response);
    }

    private PersonalizationContext buildContext(Long userId) {
        Optional<UserProfile> profile = userProfileRepository.findByUserId(userId);
        AgeBand ageBand = profile.map(UserProfile::getAge).map(AgeBand::fromAge).orElse(AgeBand.UNKNOWN);
        String goal = profile.map(UserProfile::getGoal).map(this::normalizeText).orElse(null);
        String gender = profile.map(UserProfile::getGender).map(this::normalizeText).orElse(null);
        List<String> interests = profile.map(UserProfile::getInterest).map(this::parseInterests).orElseGet(List::of);

        List<String> recentTerms = fetchRecentTerms(userId);
        return new PersonalizationContext(ageBand, goal, gender, interests, recentTerms);
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

    private PersonalizedWordExplanation composeExplanation(PersonalizationContext context, WordResponse response) {
        String personaSummary = buildPersonaSummary(context, response);
        String keyTakeaway = buildKeyTakeaway(response);
        String contextualExplanation = buildContextualExplanation(context, response);
        List<String> hooks = buildLearningHooks(context, response);
        List<String> prompts = buildReflectionPrompts(context, response);
        return new PersonalizedWordExplanation(personaSummary, keyTakeaway, contextualExplanation, hooks, prompts);
    }

    private String buildPersonaSummary(PersonalizationContext context, WordResponse response) {
        StringBuilder builder = new StringBuilder(context.ageBand().descriptor());
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
        if (StringUtils.hasText(context.gender())) {
            builder.append("。偏好语气：").append(resolveTone(context.gender()));
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

    private String buildContextualExplanation(PersonalizationContext context, WordResponse response) {
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

    private List<String> buildLearningHooks(PersonalizationContext context, WordResponse response) {
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

    private List<String> buildReflectionPrompts(PersonalizationContext context, WordResponse response) {
        List<String> prompts = new ArrayList<>();
        String term = Optional.ofNullable(response.getTerm()).filter(StringUtils::hasText).orElse("该词");
        prompts.add("如果向一位" + context.ageBand().audience() + "解释" + term + "，你会怎么说？");
        if (StringUtils.hasText(context.goal())) {
            prompts.add("这个词如何帮助你更接近" + context.goal() + "？尝试写下行动计划。");
        } else {
            prompts.add("想象在下次交流中使用该词，提前准备一句自然的表达。");
        }
        return List.copyOf(prompts);
    }

    private String resolveTone(String gender) {
        String normalized = gender.toLowerCase(Locale.ROOT);
        if (normalized.contains("女")) {
            return "柔和而坚定";
        }
        if (normalized.contains("男")) {
            return "干练且直接";
        }
        return "温和而自信";
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

    private enum AgeBand {
        CHILD("好奇心旺盛的小小探索者"),
        TEEN("目标清晰的少年学习者"),
        YOUNG_ADULT("自驱力强的青年进阶者"),
        ADULT("经验沉淀的职场实践者"),
        SENIOR("热爱分享的终身学习者"),
        UNKNOWN("保持好奇的学习者");

        private final String descriptor;

        AgeBand(String descriptor) {
            this.descriptor = descriptor;
        }

        String descriptor() {
            return descriptor;
        }

        String audience() {
            return switch (this) {
                case CHILD -> "小学阶段";
                case TEEN -> "青少年";
                case YOUNG_ADULT -> "大学或初入职场的伙伴";
                case ADULT -> "资深同事";
                case SENIOR -> "经验丰富的前辈";
                case UNKNOWN -> "身边的朋友";
            };
        }

        static AgeBand fromAge(Integer age) {
            if (age == null) {
                return UNKNOWN;
            }
            if (age <= AGE_CHILD_MAX) {
                return CHILD;
            }
            if (age <= AGE_TEEN_MAX) {
                return TEEN;
            }
            if (age <= AGE_YOUNG_ADULT_MAX) {
                return YOUNG_ADULT;
            }
            if (age <= AGE_ADULT_MAX) {
                return ADULT;
            }
            return SENIOR;
        }
    }

    private record PersonalizationContext(
        AgeBand ageBand,
        String goal,
        String gender,
        List<String> interests,
        List<String> recentTerms
    ) {
        PersonalizationContext {
            interests = interests == null ? List.of() : List.copyOf(interests);
            recentTerms = recentTerms == null ? List.of() : List.copyOf(recentTerms);
        }
    }
}
