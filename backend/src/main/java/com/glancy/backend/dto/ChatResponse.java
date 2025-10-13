package com.glancy.backend.dto;

/**
 * 背景：
 *  - 为兼容非流式聊天模式，需要向客户端返回聚合后的最终文本。
 * 目的：
 *  - 以不可变 DTO 承载同步聊天结果，保持接口语义清晰。
 * 关键决策与取舍：
 *  - 选择 Java record 以减少样板代码并确保字段只读；
 *  - 仅暴露 content 字段，后续如需更多元信息可新增字段或版本。
 * 影响范围：
 *  - ChatController 的 JSON 输出依赖该模型；
 *  - 前端解析逻辑读取 content 生成展示内容。
 * 演进与TODO：
 *  - 若需返回 tokens、耗时等指标，可通过新增字段并保持向后兼容。
 */
public record ChatResponse(String content) {}
