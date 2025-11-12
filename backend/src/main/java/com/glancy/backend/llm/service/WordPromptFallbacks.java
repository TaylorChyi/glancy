package com.glancy.backend.llm.service;

/**
 * 背景： - Prompt 组装过程中存在多处默认值（如匿名学习者描述、列表分隔符），此前通过散落的字符串硬编码实现。 目的： - 将所有词典 Prompt
 * 相关的兜底常量集中管理，避免在服务层重复硬编码并提升演进时的可控性。 关键决策与取舍： - 采用不可实例化的常量类暴露语义化方法，既保留轻量级调用也支持未来接入配置化来源。 影响范围： - 词典
 * Prompt 组装组件在缺失画像或上下文时统一引用此兜底常量，确保体验一致。 演进与TODO： - 后续若需多语言兜底策略，可扩展为枚举或配置映射并在此类集中维护。
 */
public final class WordPromptFallbacks {

  private static final String DEFAULT_PERSONA_DESCRIPTOR = "学习者";
  private static final String DEFAULT_LIST_DELIMITER = "、";

  private WordPromptFallbacks() {}

  public static String personaDescriptor() {
    return DEFAULT_PERSONA_DESCRIPTOR;
  }

  public static String listDelimiter() {
    return DEFAULT_LIST_DELIMITER;
  }
}
