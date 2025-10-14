package com.glancy.backend.controller;

import java.util.Locale;
import java.util.Optional;

/**
 * 背景：
 *  - 前端在聊天接口上同时需要流式与同步两种响应形态，原先仅依赖 Accept 头推断，
 *    在跨终端或代理场景下容易退化为错误模式。
 * 目的：
 *  - 显式建模聊天响应模式，供控制器在策略表中路由对应处理器，提升可读性与可扩展性。
 * 关键决策与取舍：
 *  - 以枚举承载有限集合（stream/sync），避免魔法字符串散落各处；
 *  - 提供 fromRequestValue 工厂方法兼容大小写并允许优雅回退。
 * 影响范围：
 *  - ChatController 将基于该枚举选择流式或聚合策略；
 *  - 未来若新增模式（如批处理），可在此扩展并注记降级策略。
 * 演进与TODO：
 *  - TODO: 若后续需要灰度开关，可在此关联特性枚举或注入配置对象。
 */
public enum ChatResponseMode {
    STREAM,
    SYNC;

    /**
     * 意图：将请求中的原始字符串解析为枚举值，允许大小写混合并在空值时返回空 Optional。
     */
    public static Optional<ChatResponseMode> fromRequestValue(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        return switch (raw.trim().toLowerCase(Locale.ROOT)) {
            case "stream" -> Optional.of(STREAM);
            case "sync" -> Optional.of(SYNC);
            default -> Optional.empty();
        };
    }
}
