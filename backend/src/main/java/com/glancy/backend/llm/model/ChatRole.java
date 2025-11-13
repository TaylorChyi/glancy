package com.glancy.backend.llm.model;

/**
 * 背景： - SSE 改造后模型交互统一走同步接口，调用端仍散落使用字符串表示角色，存在硬编码与拼写风险。 目的： - 以枚举封装模型支持的会话角色，提供统一的角色字符串，避免重复硬编码。
 * 关键决策与取舍： - 采用轻量枚举而非常量类，可在未来补充元数据（例如角色说明、是否可见）。 影响范围： - 所有模型请求构造均可复用该枚举的 `role()` 方法输出字符串，消除魔法值。
 * 演进与TODO： - 若后续引入多代理角色，可扩展额外字段标注可见性或上下文限制。
 */
public enum ChatRole {
    SYSTEM("system"),
    USER("user"),
    ASSISTANT("assistant");

    private final String role;

    ChatRole(String role) {
        this.role = role;
    }

    public String role() {
        return role;
    }
}
