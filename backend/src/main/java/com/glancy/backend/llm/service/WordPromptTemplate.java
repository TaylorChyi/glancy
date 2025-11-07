package com.glancy.backend.llm.service;

/**
 * 背景：
 *  - 词典 Prompt 需要拆分为多个模板片段以组合不同语言与风味场景。
 * 目的：
 *  - 枚举模板资源路径，便于在编译期约束模板使用并避免硬编码字符串分散。
 * 关键决策与取舍：
 *  - 使用简单枚举而非配置文件，确保调用处可直接通过常量引用路径。
 * 影响范围：
 *  - `WordPromptAssembler` 以及相关测试通过该枚举定位模板资源。
 * 演进与TODO：
 *  - 后续若引入 Prompt A/B，可在此枚举扩展版本或环境维度。
 */
public enum WordPromptTemplate {
    PERSONA_BASE("prompts/word/persona/base.txt"),
    PERSONA_TONE_CLAUSE("prompts/word/persona/tone_clause.txt"),
    PERSONA_GOAL_CLAUSE("prompts/word/persona/goal_clause.txt"),
    PERSONA_INTERESTS_CLAUSE("prompts/word/persona/interests_clause.txt"),
    USER_CHINESE_PAYLOAD("prompts/word/user/chinese_payload.txt"),
    USER_ENGLISH_PAYLOAD("prompts/word/user/english_payload.txt"),
    USER_RECENT_TERMS("prompts/word/user/recent_terms.txt"),
    USER_GOAL("prompts/word/user/goal.txt"),
    TONE_ENGLISH_DEFAULT("prompts/word/tone/english_default.txt"),
    TONE_ENGLISH_PERSONALIZED("prompts/word/tone/english_personalized.txt"),
    TONE_CHINESE_DEFAULT("prompts/word/tone/chinese_default.txt"),
    TONE_CHINESE_PERSONALIZED("prompts/word/tone/chinese_personalized.txt"),
    TONE_BILINGUAL_DEFAULT("prompts/word/tone/bilingual_default.txt"),
    TONE_BILINGUAL_PERSONALIZED("prompts/word/tone/bilingual_personalized.txt"),
    TONE_NEUTRAL_DEFAULT("prompts/word/tone/neutral_default.txt"),
    TONE_NEUTRAL_PERSONALIZED("prompts/word/tone/neutral_personalized.txt"),
    FLAVOR_ENGLISH_MONOLINGUAL("prompts/word/flavor/english_monolingual.txt"),
    FLAVOR_ENGLISH_BILINGUAL("prompts/word/flavor/english_bilingual.txt"),
    FLAVOR_CHINESE_MONOLINGUAL("prompts/word/flavor/chinese_monolingual.txt"),
    STRUCTURE_CHINESE_MONOLINGUAL("prompts/word/structure/chinese_monolingual.txt"),
    STRUCTURE_CHINESE_BILINGUAL("prompts/word/structure/chinese_bilingual.txt"),
    STRUCTURE_ENGLISH_MONOLINGUAL("prompts/word/structure/english_monolingual.txt"),
    STRUCTURE_ENGLISH_BILINGUAL("prompts/word/structure/english_bilingual.txt"),
    ENTRY_LABEL_DEFAULT("prompts/word/entry/label_default.txt"),
    ENTRY_GUIDANCE_DEFAULT("prompts/word/entry/guidance_default.txt"),
    ENTRY_LABEL_CHINESE_SINGLE("prompts/word/entry/chinese_single_label.txt"),
    ENTRY_LABEL_CHINESE_MULTI("prompts/word/entry/chinese_multi_label.txt"),
    ENTRY_GUIDANCE_CHINESE_SINGLE("prompts/word/entry/chinese_single_guidance.txt"),
    ENTRY_GUIDANCE_CHINESE_MULTI("prompts/word/entry/chinese_multi_guidance.txt"),
    ENTRY_GUIDANCE_CHINESE_MIXED("prompts/word/entry/chinese_mixed_guidance.txt"),
    ENTRY_GUIDANCE_CHINESE_NON_HAN("prompts/word/entry/chinese_non_han_guidance.txt"),
    ENTRY_GUIDANCE_CHINESE_UNKNOWN("prompts/word/entry/chinese_unknown_guidance.txt");

    private final String path;

    WordPromptTemplate(String path) {
        this.path = path;
    }

    public String path() {
        return path;
    }

    public static java.util.Set<String> allPaths() {
        java.util.EnumSet<WordPromptTemplate> all = java.util.EnumSet.allOf(WordPromptTemplate.class);
        java.util.Set<String> paths = new java.util.HashSet<>();
        for (WordPromptTemplate template : all) {
            paths.add(template.path());
        }
        return java.util.Collections.unmodifiableSet(paths);
    }
}
