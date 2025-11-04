package com.glancy.backend.service.word;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;

/**
 * 背景：
 *  - WordService 过去通过形参传递十余个参数，调用者与协作者都难以理解其语义关系。\
 * 目的：
 *  - 将查词请求的关键上下文封装为不可变记录，提供统一的数据载体给不同策略实现。\
 * 关键决策与取舍：
 *  - 选用 Java record 表达只读上下文，保证线程安全且减少样板代码；\
 *  - 若后续上下文字段继续膨胀，可考虑引入构建器模式以增强可读性。\
 * 影响范围：
 *  - 被 `WordService` 与两种查词策略引用，用于描述当前用户请求。\
 * 演进与TODO：
 *  - 可在未来扩展 A/B 测试、特性开关或实验配置等上下文字段。
 */
public record WordQueryContext(
    Long userId,
    String rawTerm,
    String normalizedTerm,
    Language language,
    DictionaryFlavor flavor,
    String model,
    boolean forceNew,
    boolean captureHistory,
    WordPersonalizationContext personalizationContext
) {}
