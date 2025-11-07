package com.glancy.backend.llm.service;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

/**
 * 背景：
 *  - Prompt 组装过程中多处需要构建模板上下文，若直接在业务代码中拼接 Map 容易滋生重复逻辑。
 * 目的：
 *  - 提供链式上下文构建工具，封装 EnumMap 到模板 Map 的转换细节。
 * 关键决策与取舍：
 *  - 以静态工厂配合 Consumer 回调构建上下文，避免在调用层暴露 Map 初始化细节并确保类型安全。
 * 影响范围：
 *  - 词典 Prompt 组装可重用此工具创建上下文，后续新增键时无需修改调用点结构。
 * 演进与TODO：
 *  - 若性能压力增大，可引入对象池或重用 EnumMap 减少垃圾产生。
 */
public final class WordPromptContext {

    private WordPromptContext() {}

    public static Map<String, String> build(Consumer<EnumMap<WordPromptContextKey, String>> populator) {
        EnumMap<WordPromptContextKey, String> values = new EnumMap<>(WordPromptContextKey.class);
        populator.accept(values);
        Map<String, String> resolved = new HashMap<>();
        values.forEach((key, value) -> {
            if (value != null) {
                resolved.put(key.placeholder(), value);
            }
        });
        return resolved;
    }
}
