package com.glancy.backend.llm.stream;

/**
 * 抖宝流式事件类型枚举。通过显式的枚举来表达协议中的事件，
 * 既避免字符串散落导致的维护成本，也为后续扩展预留空间。
 */
public enum DoubaoEventType {
    /** 普通消息事件。 */
    MESSAGE("message"),

    /** 流式错误事件。 */
    ERROR("error"),

    /** 流结束事件。 */
    END("end");

    private final String value;

    DoubaoEventType(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    /**
     * 根据事件字符串解析为枚举类型，默认为 {@link #MESSAGE}。
     *
     * @param value 事件字符串
     * @return 枚举类型
     */
    public static DoubaoEventType from(String value) {
        for (DoubaoEventType type : values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return MESSAGE;
    }
}

