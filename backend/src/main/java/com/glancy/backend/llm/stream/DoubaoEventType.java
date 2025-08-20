package com.glancy.backend.llm.stream;

/**
 * 抖宝流式事件类型枚举。使用统一的枚举有助于在解析和测试中避免魔法字符串，
 * 并为未来协议扩展提供集中管理的入口。
 */
public enum DoubaoEventType {
    MESSAGE("message"),
    ERROR("error"),
    END("end");

    private final String label;

    DoubaoEventType(String label) {
        this.label = label;
    }

    /**
     * 根据事件字符串解析枚举，无法识别的值默认为 MESSAGE。
     */
    public static DoubaoEventType from(String value) {
        for (DoubaoEventType type : values()) {
            if (type.label.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return MESSAGE;
    }

    @Override
    public String toString() {
        return label;
    }
}
