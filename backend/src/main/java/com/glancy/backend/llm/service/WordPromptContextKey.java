package com.glancy.backend.llm.service;

/**
 * 背景：
 *  - Prompt 渲染上下文的占位符此前以字符串硬编码，难以统一管理且易出错。
 * 目的：
 *  - 枚举化所有模板占位符键，提供类型安全的引用，便于在不同上下文复用。
 * 关键决策与取舍：
 *  - 将常用占位符抽象为单一枚举，避免多枚举带来的维护复杂度，同时保留语义清晰的常量名称。
 * 影响范围：
 *  - Prompt 组装与渲染逻辑统一引用此枚举，消除散落的键字符串。
 * 演进与TODO：
 *  - 后续若存在命名空间冲突，可引入前缀或拆分子枚举集中管理。
 */
public enum WordPromptContextKey {
    PERSONA_DESCRIPTOR("personaDescriptor"),
    PERSONA_TONE_CLAUSE("toneClause"),
    PERSONA_GOAL_CLAUSE("goalClause"),
    PERSONA_INTERESTS_CLAUSE("interestsClause"),
    CLAUSE_TONE("tone"),
    CLAUSE_GOAL("goal"),
    CLAUSE_INTERESTS("interests"),
    CLAUSE_TERMS("terms"),
    TERM("term"),
    ENTRY_TYPE("entryType"),
    ENTRY_GUIDANCE("entryGuidance"),
    STRUCTURE_REQUIREMENT("structureRequirement"),
    RECENT_TERMS_SECTION("recentTermsSection"),
    GOAL_SECTION("goalSection"),
    TONE_DIRECTIVE("toneDirective");

    private final String placeholder;

    WordPromptContextKey(String placeholder) {
        this.placeholder = placeholder;
    }

    public String placeholder() {
        return placeholder;
    }
}
