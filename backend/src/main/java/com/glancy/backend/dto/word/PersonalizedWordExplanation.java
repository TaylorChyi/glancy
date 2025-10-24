/**
 * 背景：
 *  - 个性化词汇解释 DTO 先前与聊天、搜索等模型混放，个性化学习领域难以聚合。
 * 目的：
 *  - 在 word 包集中描述个性化学习内容，便于策略服务复用。
 * 关键决策与取舍：
 *  - 使用 record 表达不可变解释结构，策略逻辑由 personalization 服务提供。
 * 影响范围：
 *  - 个性化服务及响应组装器导入路径更新。
 * 演进与TODO：
 *  - 如需支持多语言或多模态提示，可在本包扩展字段。
 */
package com.glancy.backend.dto.word;

import java.util.List;

/**
 * Encapsulates a personalized narrative that helps a user connect a word
 * definition with their learning context.
 */
public record PersonalizedWordExplanation(
    String personaSummary,
    String keyTakeaway,
    String contextualExplanation,
    List<String> learningHooks,
    List<String> reflectionPrompts
) {}
