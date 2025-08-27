package com.glancy.backend.client;

import static com.glancy.backend.util.ClientUtils.maskKey;
import static com.glancy.backend.util.ClientUtils.trimTrailingSlash;

import com.glancy.backend.llm.llm.StreamingLLMClient;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.parser.StreamDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** DeepSeek 流式客户端，实现 SSE 解析与容错。 */
@Slf4j
@Component("deepSeekStreamClient")
public class DeepSeekStreamClient implements StreamingLLMClient {

  private final WebClient webClient;
  private final StreamDecoder decoder;
  private final String apiKey;

  public DeepSeekStreamClient(
      WebClient.Builder builder,
      @Value("${thirdparty.deepseek.base-url:https://api.deepseek.com}") String baseUrl,
      @Value("${thirdparty.deepseek.api-key:}") String apiKey,
      StreamDecoder decoder) {
    this.apiKey = apiKey == null ? null : apiKey.trim();
    WebClient.Builder baseBuilder = builder.baseUrl(trimTrailingSlash(baseUrl));
    if (this.apiKey != null && !this.apiKey.isEmpty()) {
      baseBuilder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + this.apiKey);
    }
    this.webClient = baseBuilder.build();
    this.decoder = decoder;
    if (this.apiKey == null || this.apiKey.isBlank()) {
      log.warn("DeepSeek API key is empty");
    } else {
      log.info("DeepSeek API key loaded: {}", maskKey(this.apiKey));
    }
  }

  @Override
  public String name() {
    return "deepseek";
  }

  @Override
  public Flux<String> streamChat(List<ChatMessage> messages, double temperature) {
    Map<String, Object> body = new HashMap<>();
    body.put("model", "deepseek-chat");
    body.put("temperature", temperature);
    body.put("stream", true);
    List<Map<String, String>> reqMessages = new ArrayList<>();
    for (ChatMessage m : messages) {
      reqMessages.add(Map.of("role", m.getRole(), "content", m.getContent()));
    }
    body.put("messages", reqMessages);

    return webClient
        .post()
        .uri("/v1/chat/completions")
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.TEXT_EVENT_STREAM)
        .bodyValue(body)
        .retrieve()
        .bodyToFlux(String.class)
        .takeUntil(decoder::isDone)
        .filter(data -> !decoder.isDone(data))
        .flatMap(data -> Mono.justOrEmpty(decoder.decode(data)))
        .onErrorResume(
            e -> {
              log.warn("Stream interrupted", e);
              return Flux.empty();
            });
  }

}
