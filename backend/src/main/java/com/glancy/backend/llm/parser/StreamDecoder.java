package com.glancy.backend.llm.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** 将 SSE 数据片段解析为文本内容，遇到异常返回空结果。 */
@Slf4j
@Component
public class StreamDecoder {

  private final ObjectMapper mapper = new ObjectMapper();

  public Optional<String> decode(String data) {
    if (data == null || data.isBlank()) {
      return Optional.empty();
    }
    if (isDone(data)) {
      return Optional.empty();
    }
    try {
      JsonNode node = mapper.readTree(data);
      JsonNode content = node.at("/choices/0/delta/content");
      if (content.isTextual()) {
        return Optional.of(content.asText());
      }
    } catch (Exception e) {
      log.warn("Failed to parse stream chunk: {}", data, e);
    }
    return Optional.empty();
  }

  public boolean isDone(String data) {
    return data != null && "[DONE]".equals(data.trim());
  }
}
