/**
 * 背景：
 *  - 个性化上下文 DTO 先前与其他领域混放，词汇个性化信号难以聚合。
 * 目的：
 *  - 在 word 包捕获驱动个性化提示的用户信号，支撑 LLM prompt 适配。
 * 关键决策与取舍：
 *  - 通过 record 与防御性拷贝确保不可变性，hasSignals 提供轻量检查；包划分强化领域边界。
 * 影响范围：
 *  - 个性化服务与 WordService 导入路径更新。
 * 演进与TODO：
 *  - 若支持更多信号，可在本包扩展字段并考虑策略模式组合。
 */
package com.glancy.backend.dto.word;

import java.util.List;

/**
 * Captures the learner persona signals that drive LLM prompt adaptation and
 * downstream personalized explanations.
 */
public record WordPersonalizationContext(
    String personaDescriptor,
    boolean personaDerivedFromProfile,
    String audienceDescriptor,
    String goal,
    String preferredTone,
    List<String> interests,
    List<String> recentTerms
) {
    public WordPersonalizationContext {
        interests = interests == null ? List.of() : List.copyOf(interests);
        recentTerms = recentTerms == null ? List.of() : List.copyOf(recentTerms);
    }

    public boolean hasSignals() {
        return (
            personaDerivedFromProfile ||
            (goal != null && !goal.isBlank()) ||
            (preferredTone != null && !preferredTone.isBlank()) ||
            !interests.isEmpty() ||
            !recentTerms.isEmpty()
        );
    }
}
