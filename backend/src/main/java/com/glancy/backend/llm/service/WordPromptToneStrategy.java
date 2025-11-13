package com.glancy.backend.llm.service;

/**
 * 背景： - 不同词典风味需要差异化的语气模板，原实现以内部记录类型定义且散落于服务中。 目的： - 以枚举集中管理语气模板组合，便于根据风味快速选择默认或个性化模板。 关键决策与取舍： -
 * 使用枚举保证有限集合的语气策略可枚举并易于扩展，同时提供访问器暴露模板引用。 影响范围： - 词典 Prompt 组装可通过映射选择对应策略，减少重复代码。 演进与TODO： -
 * 如需支持区域化或版本化语气，可在枚举中补充元数据或拆分子策略。
 */
public enum WordPromptToneStrategy {
    ENGLISH(WordPromptTemplateConstants.TONE_ENGLISH_DEFAULT, WordPromptTemplateConstants.TONE_ENGLISH_PERSONALIZED),
    CHINESE(WordPromptTemplateConstants.TONE_CHINESE_DEFAULT, WordPromptTemplateConstants.TONE_CHINESE_PERSONALIZED),
    BILINGUAL(
            WordPromptTemplateConstants.TONE_BILINGUAL_DEFAULT,
            WordPromptTemplateConstants.TONE_BILINGUAL_PERSONALIZED),
    NEUTRAL(WordPromptTemplateConstants.TONE_NEUTRAL_DEFAULT, WordPromptTemplateConstants.TONE_NEUTRAL_PERSONALIZED);

    private final String defaultTemplate;
    private final String personalizedTemplate;

    WordPromptToneStrategy(String defaultTemplate, String personalizedTemplate) {
        this.defaultTemplate = defaultTemplate;
        this.personalizedTemplate = personalizedTemplate;
    }

    public String defaultTemplate() {
        return defaultTemplate;
    }

    public String personalizedTemplate() {
        return personalizedTemplate;
    }
}
