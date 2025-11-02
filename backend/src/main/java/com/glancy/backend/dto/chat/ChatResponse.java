/**
 * 背景：
 *  - 聊天响应 DTO 与其他领域混放，难以从结构上识别对话结果模型。
 * 目的：
 *  - 在 chat 包承载同步聊天响应，保持对话领域清晰。
 * 关键决策与取舍：
 *  - 继续使用 record 表达只读结构，未来如需返回 token 等元信息可扩展字段。
 * 影响范围：
 *  - ChatController 及前端解析逻辑导入路径更新。
 * 演进与TODO：
 *  - TODO: 若支持多段消息，可考虑改为列表或版本化响应。
 */
package com.glancy.backend.dto.chat;

public record ChatResponse(String content) {}
