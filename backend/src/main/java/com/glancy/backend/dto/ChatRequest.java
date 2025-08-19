package com.glancy.backend.dto;

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
}
