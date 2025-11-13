package com.glancy.backend.llm.llm;

import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;

/**
 * 背景： - 词典检索统一调用多个模型供应商，需要一个聚焦于“词条生成”的客户端抽象。 目的： - 提供阻塞式的词条生成接口，避免“chat”语义导致的上下文混淆，明确职责边界。 关键决策与取舍：
 * - 仅暴露一次性生成方法，放弃流式接口以降低状态管理复杂度。 影响范围： - 所有词条生成调用方均通过该端口访问具体模型实现。 演进与TODO： -
 * 若未来需要增量输出，可引入并行的流式接口并通过特性开关切换。
 */
public interface DictionaryModelClient {
    /**
     * 意图：向后端选择的词典模型提交上下文消息，请求生成完整的词条解释。 输入：预处理后的消息列表、温度参数。 输出：模型一次性返回的词条正文字符串。 流程： 1) 实现方执行阻塞式
     * HTTP/SDK 调用。 2) 聚合供应商返回的片段并返回完整文本。 错误处理：实现方负责转换供应商异常为语义化错误。 复杂度：依赖下游网络调用，方法本身为 O(n) 消息序列化成本。
     */
    default String generateEntry(List<ChatMessage> messages, double temperature) {
        return generateEntry(messages, temperature, DictionaryModelRequestOptions.defaults());
    }

    String generateEntry(List<ChatMessage> messages, double temperature, DictionaryModelRequestOptions options);

    /** 返回当前客户端名称，用于配置与路由。 */
    String name();
}
