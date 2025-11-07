package com.glancy.backend.llm.llm;

import java.util.Objects;

/**
 * 背景：
 *  - 词典模型供应商逐步提供更多可调参数，现有接口仅支持固定的温度设置难以扩展。
 * 目的：
 *  - 以值对象封装可选的调用参数（如 stream、thinkingType），避免在调用链中传播散乱的布尔值或字符串。
 * 关键决策与取舍：
 *  - 采用不可变记录类配合构建器，既保障类型安全也便于未来追加字段；相比 Map 传参具备编译期约束。
 * 影响范围：
 *  - 所有模型客户端都可复用该对象描述扩展参数，默认值保持向后兼容。
 * 演进与TODO：
 *  - 若模型参数增长，可引入特性开关或分组构建器以避免构造方法过长。
 */
public final class DictionaryModelRequestOptions {

    private final Boolean stream;
    private final String thinkingType;

    private DictionaryModelRequestOptions(Builder builder) {
        this.stream = builder.stream;
        this.thinkingType = builder.thinkingType;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static DictionaryModelRequestOptions defaults() {
        return builder().build();
    }

    public Boolean stream() {
        return stream;
    }

    public String thinkingType() {
        return thinkingType;
    }

    public boolean resolveStream(boolean fallback) {
        return stream == null ? fallback : stream.booleanValue();
    }

    public String resolveThinkingType(String fallback) {
        return Objects.requireNonNullElse(thinkingType, fallback);
    }

    public static final class Builder {

        private Boolean stream;
        private String thinkingType;

        private Builder() {}

        public Builder stream(Boolean stream) {
            this.stream = stream;
            return this;
        }

        public Builder thinkingType(String thinkingType) {
            this.thinkingType = thinkingType;
            return this;
        }

        public DictionaryModelRequestOptions build() {
            return new DictionaryModelRequestOptions(this);
        }
    }
}
