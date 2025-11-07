package com.glancy.backend.llm.llm;

import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;

/**
 * 面向不同大语言模型厂商的统一客户端接口。经评估后端调用场景均为阻塞式，
 * 因此仅保留同步 {@link #chat(List, double)} 以降低实现复杂度并避免流式协议
 * 带来的状态管理开销。
 */
public interface LLMClient {
    /**
     * 同步聊天接口，返回模型一次性生成的完整回复。实现方可根据供应商 API
     * 选择阻塞式 HTTP 或异步调用后聚合结果。
     */
    String chat(List<ChatMessage> messages, double temperature);

    /** 返回当前客户端名称，用于配置与路由。 */
    String name();
}
