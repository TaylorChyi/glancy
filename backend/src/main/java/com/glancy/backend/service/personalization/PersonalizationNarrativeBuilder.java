package com.glancy.backend.service.personalization;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 负责根据个性化上下文构建文案描述，保持 {@link DefaultWordPersonalizationService} 聚焦数据组装。
 */
@Component
class PersonalizationNarrativeBuilder {

    private static final int HOOK_LIMIT = 3;

    PersonalizedWordExplanation compose(WordPersonalizationContext context, WordResponse response) {
        String personaSummary = buildPersonaSummary(context, response);
        String keyTakeaway = buildKeyTakeaway(response);
        String contextualExplanation = buildContextualExplanation(context, response);
        List<String> hooks = buildLearningHooks(context, response);
        List<String> prompts = buildReflectionPrompts(context, response);
        return new PersonalizedWordExplanation(personaSummary, keyTakeaway, contextualExplanation, hooks, prompts);
    }

    private String buildPersonaSummary(WordPersonalizationContext context, WordResponse response) {
        StringBuilder builder = new StringBuilder(context.personaDescriptor());
        appendInterestOverview(context, builder);
        appendGoalOverview(context, builder);
        appendTonePreference(context, builder);
        appendFocusWord(response, builder);
        return builder.toString();
    }

    private void appendInterestOverview(WordPersonalizationContext context, StringBuilder builder) {
        if (context.interests().isEmpty()) {
            return;
        }
        String interests = String.join(
            "、",
            context.interests().subList(0, Math.min(context.interests().size(), HOOK_LIMIT))
        );
        builder.append("，关注").append(interests);
    }

    private void appendGoalOverview(WordPersonalizationContext context, StringBuilder builder) {
        if (StringUtils.hasText(context.goal())) {
            builder.append("，正在为了").append(context.goal()).append("努力");
        }
    }

    private void appendTonePreference(WordPersonalizationContext context, StringBuilder builder) {
        if (StringUtils.hasText(context.preferredTone())) {
            builder.append("。偏好语气：").append(context.preferredTone());
        }
    }

    private void appendFocusWord(WordResponse response, StringBuilder builder) {
        if (StringUtils.hasText(response.getTerm())) {
            builder.append("。本次聚焦词汇：").append(response.getTerm());
        }
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
        List<String> segments = new ArrayList<>();
        segments.add(buildInterestGuidance(context));
        segments.add(buildExampleGuidance(response));
        return segments.stream().filter(StringUtils::hasText).collect(Collectors.joining(" "));
    }

    private String buildInterestGuidance(WordPersonalizationContext context) {
        if (context.interests().isEmpty()) {
            return "结合你熟悉的生活或工作片段，构建专属语境。";
        }
        String interests = String.join(
            "、",
            context.interests().subList(0, Math.min(context.interests().size(), HOOK_LIMIT))
        );
        return "将其代入你关心的" + interests + "场景，更容易感知语感差异。";
    }

    private String buildExampleGuidance(WordResponse response) {
        if (StringUtils.hasText(response.getExample())) {
            return "示例提示：" + trimExample(response.getExample()) + "。试着改写成与目标相关的句子。";
        }
        if (response.getPhrases() != null && !response.getPhrases().isEmpty()) {
            String phrases = String.join(
                "、",
                response.getPhrases().subList(0, Math.min(response.getPhrases().size(), HOOK_LIMIT))
            );
            return "可以从常见词组如" + phrases + "入手体会语义层次。";
        }
        return "若暂无示例，可结合你的任务场景自行创造句子，加深语境记忆。";
    }

    private List<String> buildLearningHooks(WordPersonalizationContext context, WordResponse response) {
        List<String> hooks = new ArrayList<>();
        appendRecentTermHook(context, response, hooks);
        appendSynonymHook(response, hooks);
        appendAntonymHook(response, hooks);
        if (hooks.isEmpty()) {
            hooks.add("将该词写入今日的学习清单，并尝试与目标任务结合。");
        }
        return List.copyOf(hooks);
    }

    private void appendRecentTermHook(WordPersonalizationContext context, WordResponse response, List<String> hooks) {
        if (context.recentTerms().isEmpty() || !StringUtils.hasText(response.getTerm())) {
            return;
        }
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

    private void appendSynonymHook(WordResponse response, List<String> hooks) {
        if (response.getSynonyms() == null || response.getSynonyms().isEmpty()) {
            return;
        }
        hooks.add(
            "同义词提示：" +
            response.getSynonyms().stream().limit(HOOK_LIMIT).collect(Collectors.joining("、")) +
            "，尝试写出差异化例句。"
        );
    }

    private void appendAntonymHook(WordResponse response, List<String> hooks) {
        if (response.getAntonyms() == null || response.getAntonyms().isEmpty()) {
            return;
        }
        hooks.add(
            "反义词提示：" +
            response.getAntonyms().stream().limit(HOOK_LIMIT).collect(Collectors.joining("、")) +
            "，帮助构建对立语境。"
        );
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
}
