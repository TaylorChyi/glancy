package com.glancy.backend.llm.stream;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** 解析遵循 SSE "data: {json}" 协议的模型输出。该实现符合 OpenAI 兼容格式， 多数厂商可直接复用，若有差异可另外提供实现。 */
@Component
public class SseStreamDecoder implements StreamDecoder {

  private final ObjectMapper mapper = new ObjectMapper();

  @Override
  public Flux<String> decode(Flux<String> rawStream) {
    return rawStream
        .map(String::trim)
        .filter(line -> line.startsWith("data:"))
        .map(line -> line.substring(5).trim())
        .takeWhile(line -> !"[DONE]".equals(line))
        .flatMap(this::extractContent)
        .filter(str -> !str.isEmpty());
  }

  private Mono<String> extractContent(String json) {
    try {
      JsonNode node = mapper.readTree(json);
      JsonNode delta = node.path("choices").path(0).path("delta").path("content");
      return Mono.justOrEmpty(delta.asText());
    } catch (Exception e) {
      return Mono.empty();
    }
  }
}
