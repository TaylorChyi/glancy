package com.glancy.backend.service.word;

/**
 * 背景：
 *  - 流式接口需要返回既包含普通数据又包含版本号的事件，使用字符串拼接难以维护。\
 * 目的：
 *  - 提供语义化的响应载体，既可承载 SSE 数据，也能扩展新的事件类型。\
 * 关键决策与取舍：
 *  - 选用 Java record 实现不可变数据结构，简化 equals/hashCode；\
 *  - 预留 event 字段以支持未来扩展更多事件类型。\
 * 影响范围：
 *  - `WordService` 的流式接口及相关测试使用该载体。\
 * 演进与TODO：
 *  - 如需多语言提示或错误事件，可在此处新增静态工厂方法。
 */
public record WordStreamPayload(String event, String data) {
    public static WordStreamPayload data(String data) {
        return new WordStreamPayload(null, data);
    }

    public static WordStreamPayload version(String versionId) {
        return new WordStreamPayload("version", versionId);
    }
}
