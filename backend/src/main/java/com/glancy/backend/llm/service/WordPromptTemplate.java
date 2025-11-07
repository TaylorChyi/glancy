package com.glancy.backend.llm.service;

/**
 * 背景：
 *  - 词典 Prompt 需要拆分为多个模板片段以组合不同语言与风味场景。
 * 目的：
 *  - 枚举模板文本常量，便于在编译期约束模板使用并避免硬编码字符串分散。
 * 关键决策与取舍：
 *  - 使用简单枚举而非配置文件，确保调用处可直接通过常量引用路径。
 * 影响范围：
 *  - `WordPromptAssembler` 以及相关测试通过该枚举定位模板内容。
 * 演进与TODO：
 *  - 后续若引入 Prompt A/B，可在此枚举扩展版本或环境维度。
 */
public enum WordPromptTemplate {
    PERSONA_BASE(WordPromptTemplateConstants.PERSONA_BASE),
    PERSONA_TONE_CLAUSE(WordPromptTemplateConstants.PERSONA_TONE_CLAUSE),
    PERSONA_GOAL_CLAUSE(WordPromptTemplateConstants.PERSONA_GOAL_CLAUSE),
    PERSONA_INTERESTS_CLAUSE(WordPromptTemplateConstants.PERSONA_INTERESTS_CLAUSE),
    USER_CHINESE_PAYLOAD(WordPromptTemplateConstants.USER_CHINESE_PAYLOAD),
    USER_ENGLISH_PAYLOAD(WordPromptTemplateConstants.USER_ENGLISH_PAYLOAD),
    USER_RECENT_TERMS(WordPromptTemplateConstants.USER_RECENT_TERMS),
    USER_GOAL(WordPromptTemplateConstants.USER_GOAL),
    TONE_ENGLISH_DEFAULT(WordPromptTemplateConstants.TONE_ENGLISH_DEFAULT),
    TONE_ENGLISH_PERSONALIZED(WordPromptTemplateConstants.TONE_ENGLISH_PERSONALIZED),
    TONE_CHINESE_DEFAULT(WordPromptTemplateConstants.TONE_CHINESE_DEFAULT),
    TONE_CHINESE_PERSONALIZED(WordPromptTemplateConstants.TONE_CHINESE_PERSONALIZED),
    TONE_BILINGUAL_DEFAULT(WordPromptTemplateConstants.TONE_BILINGUAL_DEFAULT),
    TONE_BILINGUAL_PERSONALIZED(WordPromptTemplateConstants.TONE_BILINGUAL_PERSONALIZED),
    TONE_NEUTRAL_DEFAULT(WordPromptTemplateConstants.TONE_NEUTRAL_DEFAULT),
    TONE_NEUTRAL_PERSONALIZED(WordPromptTemplateConstants.TONE_NEUTRAL_PERSONALIZED),
    FLAVOR_ENGLISH_MONOLINGUAL(WordPromptTemplateConstants.FLAVOR_ENGLISH_MONOLINGUAL),
    FLAVOR_ENGLISH_BILINGUAL(WordPromptTemplateConstants.FLAVOR_ENGLISH_BILINGUAL),
    FLAVOR_CHINESE_MONOLINGUAL(WordPromptTemplateConstants.FLAVOR_CHINESE_MONOLINGUAL),
    STRUCTURE_CHINESE_MONOLINGUAL(WordPromptTemplateConstants.STRUCTURE_CHINESE_MONOLINGUAL),
    STRUCTURE_CHINESE_BILINGUAL(WordPromptTemplateConstants.STRUCTURE_CHINESE_BILINGUAL),
    STRUCTURE_ENGLISH_MONOLINGUAL(WordPromptTemplateConstants.STRUCTURE_ENGLISH_MONOLINGUAL),
    STRUCTURE_ENGLISH_BILINGUAL(WordPromptTemplateConstants.STRUCTURE_ENGLISH_BILINGUAL),
    ENTRY_LABEL_DEFAULT(WordPromptTemplateConstants.ENTRY_LABEL_DEFAULT),
    ENTRY_GUIDANCE_DEFAULT(WordPromptTemplateConstants.ENTRY_GUIDANCE_DEFAULT),
    ENTRY_LABEL_CHINESE_SINGLE(WordPromptTemplateConstants.ENTRY_LABEL_CHINESE_SINGLE),
    ENTRY_LABEL_CHINESE_MULTI(WordPromptTemplateConstants.ENTRY_LABEL_CHINESE_MULTI),
    ENTRY_GUIDANCE_CHINESE_SINGLE(WordPromptTemplateConstants.ENTRY_GUIDANCE_CHINESE_SINGLE),
    ENTRY_GUIDANCE_CHINESE_MULTI(WordPromptTemplateConstants.ENTRY_GUIDANCE_CHINESE_MULTI),
    ENTRY_GUIDANCE_CHINESE_MIXED(WordPromptTemplateConstants.ENTRY_GUIDANCE_CHINESE_MIXED),
    ENTRY_GUIDANCE_CHINESE_NON_HAN(WordPromptTemplateConstants.ENTRY_GUIDANCE_CHINESE_NON_HAN),
    ENTRY_GUIDANCE_CHINESE_UNKNOWN(WordPromptTemplateConstants.ENTRY_GUIDANCE_CHINESE_UNKNOWN);

    private final String content;

    WordPromptTemplate(String content) {
        this.content = content;
    }

    public String content() {
        return content;
    }
}
