package com.glancy.backend.client;

import static com.glancy.backend.util.ClientUtils.ensureLeadingSlash;
import static com.glancy.backend.util.ClientUtils.maskKey;
import static com.glancy.backend.util.ClientUtils.trimTrailingSlash;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.stream.StreamDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

/** 针对抖宝模型的客户端实现，基于 WebClient 支持流式响应。 */
@Slf4j
@Component("doubaoClient")
public class DoubaoClient implements LLMClient {

  private final WebClient webClient;
  private final StreamDecoder decoder;
  private final String chatPath;
  private final String apiKey;
  private final String model;

  public DoubaoClient(
      WebClient.Builder builder,
      DoubaoProperties properties,
      @Qualifier("doubaoStreamDecoder") StreamDecoder decoder) {
    this.webClient = builder.baseUrl(trimTrailingSlash(properties.getBaseUrl())).build();
    this.decoder = decoder;
    this.chatPath = ensureLeadingSlash(properties.getChatPath());
    this.apiKey = properties.getApiKey() == null ? null : properties.getApiKey().trim();
    this.model = properties.getModel();
    if (apiKey == null || apiKey.isBlank()) {
      log.warn("Doubao API key is empty");
    } else {
      log.info("Doubao API key loaded: {}", maskKey(apiKey));
    }
  }

  @Override
  public String name() {
    return "doubao";
  }

  @Override
  public Flux<String> streamChat(List<ChatMessage> messages, double temperature) {
    log.info(
        "DoubaoClient.streamChat called with {} messages, temperature={}",
        messages.size(),
        temperature);

    Map<String, Object> body = new HashMap<>();
    body.put("model", model);
    body.put("temperature", temperature);
    body.put("stream", true);
    body.put("thinking", Map.of("type", "disabled"));

    List<Map<String, String>> reqMessages = new ArrayList<>();
    for (ChatMessage m : messages) {
      reqMessages.add(Map.of("role", m.getRole(), "content", m.getContent()));
    }
    List<String> roles = messages.stream().map(ChatMessage::getRole).toList();
    log.info("Prepared {} request messages with roles {}", reqMessages.size(), roles);
    body.put("messages", reqMessages);

    log.info("Request body prepared for Doubao API: {}", body);
    return webClient
        .post()
        .uri(chatPath)
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.TEXT_EVENT_STREAM)
        .headers(
            h -> {
              if (apiKey != null && !apiKey.isEmpty()) {
                h.setBearerAuth(apiKey);
              }
            })
        .bodyValue(body)
        .exchangeToFlux(this::handleResponse)
        .transform(decoder::decode);
  }

  private Flux<String> handleResponse(ClientResponse resp) {
    if (resp.statusCode().is4xxClientError()) {
      if (resp.statusCode().value() == 401) {
        return Flux.error(
            new com.glancy.backend.exception.UnauthorizedException("Invalid Doubao API key"));
      }
      return Flux.error(
          new com.glancy.backend.exception.BusinessException(
              "Failed to call Doubao API: " + resp.statusCode(), null));
    }
    return resp.bodyToFlux(DataBuffer.class)
        .map(
            buf -> {
              String raw = buf.toString(StandardCharsets.UTF_8);
              DataBufferUtils.release(buf);
              return raw;
            })
        .doOnNext(raw -> log.info("SSE event [{}]: {}", extractEventType(raw), raw));
  }

  private String extractEventType(String raw) {
    for (String line : raw.split("\n")) {
      line = line.trim();
      if (line.startsWith("event:")) {
        return line.substring(6).trim();
      }
    }
    return "message";
  }
}
