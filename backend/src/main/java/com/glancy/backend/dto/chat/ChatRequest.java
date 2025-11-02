/**
 * 背景：
 *  - 聊天请求 DTO 与其他服务模型混放，难以快速定位 LLM 调用契约。
 * 目的：
 *  - 在 chat 包聚合聊天请求参数，突出对话场景并方便扩展。
 * 关键决策与取舍：
 *  - 维持简单字段定义，由上层服务负责策略选择；包划分避免与词典查询混淆。
 * 影响范围：
 *  - ChatController 等调用者导入路径更新。
 * 演进与TODO：
 *  - 未来若支持并行工具调用，可在本包扩展工具参数结构。
 */
package com.glancy.backend.dto.chat;

import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import lombok.Data;

/**
 * 请求模型与消息历史以启动流式聊天。
 */
@Data
public class ChatRequest {

    /**
     * 指定要使用的大模型名称。
     */
    private String model;

    /**
     * 聊天消息历史，按顺序排列。
     */
    private List<ChatMessage> messages;

    /**
     * 温度参数，缺省采用适中的 0.7。
     */
    private double temperature = 0.7d;

    /**
     * 调用方期望的响应模式，可选 "stream" 或 "sync"，默认为流式输出。
     */
    private String responseMode;
}
