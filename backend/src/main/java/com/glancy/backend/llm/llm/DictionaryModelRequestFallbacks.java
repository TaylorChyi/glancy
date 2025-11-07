package com.glancy.backend.llm.llm;

/**
 * 背景：
 *  - 词典模型逐步暴露额外控制参数，外部配置可能缺失或留空，导致客户端需要兜底默认值。
 * 目的：
 *  - 集中管理模型请求的兜底配置，避免在调用处散落硬编码字符串或布尔值。
 * 关键决策与取舍：
 *  - 采用不可实例化的常量类暴露受支持的默认值，并提供解析方法统一处理空值。
 * 影响范围：
 *  - 所有模型客户端可复用此兜底策略，保证默认行为一致可追踪。
 * 演进与TODO：
 *  - 后续若模型参数扩展，可在此类新增命名常量与解析方法或改造为配置驱动。
 */
public final class DictionaryModelRequestFallbacks {

    private static final String THINKING_DISABLED = "disabled";

    private DictionaryModelRequestFallbacks() {}

    public static String resolveThinkingType(String configured) {
        return configured == null || configured.isBlank() ? THINKING_DISABLED : configured;
    }
}
