package com.glancy.backend.llm.llm;

import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import reactor.core.publisher.Flux;

/**
 * 面向不同大语言模型厂商的统一客户端接口。为了兼顾同步与流式两种交互形式， 接口首先暴露 {@link #streamChat(List, double)}，默认 {@link
 * #chat(List, double)} 基于流式结果聚合字符串，便于在传统阻塞场景下复用同一实现。
 */
public interface LLMClient {
  /** 以流式方式与模型交互，返回内容片段的 {@link Flux}。调用方可以逐段消费， 也可以聚合为完整字符串。 */
  Flux<String> streamChat(List<ChatMessage> messages, double temperature);

  /** 同步聊天接口，默认聚合 {@link #streamChat(List, double)} 的结果。 调用方若无特殊需求，可直接使用该方法。 */
  default String chat(List<ChatMessage> messages, double temperature) {
    return streamChat(messages, temperature)
        .reduce(new StringBuilder(), StringBuilder::append)
        .map(StringBuilder::toString)
        .blockOptional()
        .orElse("");
  }

  /** 返回当前客户端名称，用于配置与路由。 */
  String name();
}
