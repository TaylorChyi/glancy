package com.glancy.backend.client;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.dto.ChatCompletionResponse;
import com.glancy.backend.exception.BusinessException;
import com.glancy.backend.exception.UnauthorizedException;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.stream.StreamDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * 针对抖宝模型的客户端实现，基于 WebClient 支持流式响应。
 */
@Slf4j
@Component("doubaoClient")
public class DoubaoClient implements LLMClient {

    private final WebClient webClient;
    private final StreamDecoder decoder;
    private final String chatPath;
    private final String apiKey;
    private final String model;
    private final Integer maxCompletionTokens;

    public DoubaoClient(
        WebClient.Builder builder,
        DoubaoProperties properties,
        @Qualifier("doubaoStreamDecoder") StreamDecoder decoder
    ) {
        this.webClient = builder.baseUrl(trimTrailingSlash(properties.getBaseUrl())).build();
        this.decoder = decoder;
        this.chatPath = ensureLeadingSlash(properties.getChatPath());
        this.apiKey = properties.getApiKey() == null ? null : properties.getApiKey().trim();
        this.model = properties.getModel();
        this.maxCompletionTokens = properties.getMaxCompletionTokens();
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
            "DoubaoClient.streamChat called with {} messages, temperature={}, stream=true",
            messages.size(),
            temperature
        );

        Map<String, Object> body = prepareRequestBody(messages, temperature, true);
        log.info("Request body prepared for Doubao API: {}", body);
        return prepareRequest(body, MediaType.TEXT_EVENT_STREAM)
            .exchangeToFlux(this::handleStreamResponse)
            .transform(decoder::decode);
    }

    
    @Override
    public String chat(List<ChatMessage> messages, double temperature) {
        log.info(
            "DoubaoClient.chat called with {} messages, temperature={}, stream=false",
            messages.size(),
            temperature
        );
        Map<String, Object> body = prepareRequestBody(messages, temperature, false);
        return prepareRequest(body, MediaType.APPLICATION_JSON)
            .exchangeToMono(this::handleSyncResponse)
            .map(this::extractAssistantContent)
            .doOnNext(content -> log.info("DoubaoClient.chat aggregated response length={}", content.length()))
            .blockOptional()
            .orElse("");
    }

    /**
     * 意图：根据调用方指定的模式构造抖宝请求体。
     * 输入：消息列表、温度及是否启用流式响应。
     * 输出：含 stream 标识的请求参数映射。
     * 复杂度：O(n)，n 为消息数量。
     */
    private Map<String, Object> prepareRequestBody(List<ChatMessage> messages, double temperature, boolean stream) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("temperature", temperature);
        body.put("stream", stream);
        body.put("thinking", Map.of("type", "disabled"));
        if (maxCompletionTokens != null && maxCompletionTokens > 0) {
            body.put("max_completion_tokens", maxCompletionTokens);
        }

        List<Map<String, String>> reqMessages = new ArrayList<>();
        for (ChatMessage m : messages) {
            reqMessages.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }
        List<String> roles = messages.stream().map(ChatMessage::getRole).toList();
        log.info("Prepared {} request messages with roles {}", reqMessages.size(), roles);
        body.put("messages", reqMessages);
        return body;
    }

    private WebClient.RequestHeadersSpec<?> prepareRequest(Map<String, Object> body, MediaType acceptType) {
        return webClient
            .post()
            .uri(chatPath)
            .contentType(MediaType.APPLICATION_JSON)
            .accept(acceptType)
            .headers(h -> {
                if (apiKey != null && !apiKey.isEmpty()) {
                    h.setBearerAuth(apiKey);
                }
            })
            .bodyValue(body);
    }

    private Flux<String> handleStreamResponse(ClientResponse resp) {
        if (resp.statusCode().is4xxClientError()) {
            if (resp.statusCode().value() == 401) {
                return Flux.error(new UnauthorizedException("Invalid Doubao API key"));
            }
            return Flux.error(new BusinessException("Failed to call Doubao API: " + resp.statusCode()));
        }
        return resp
            .bodyToFlux(DataBuffer.class)
            .map(buf -> {
                String raw = buf.toString(StandardCharsets.UTF_8);
                DataBufferUtils.release(buf);
                return raw;
            })
            .doOnNext(raw -> log.info("SSE event [{}]: {}", extractEventType(raw), raw));
    }

    /**
     * 意图：处理非流式响应并将其转换为 ChatCompletionResponse。
     */
    private Mono<ChatCompletionResponse> handleSyncResponse(ClientResponse resp) {
        if (resp.statusCode().is4xxClientError()) {
            if (resp.statusCode().value() == 401) {
                return Mono.error(new UnauthorizedException("Invalid Doubao API key"));
            }
            return Mono.error(new BusinessException("Failed to call Doubao API: " + resp.statusCode()));
        }
        if (resp.statusCode().is5xxServerError()) {
            return Mono.error(new BusinessException("Doubao API returned 5xx: " + resp.statusCode()));
        }
        return resp.bodyToMono(ChatCompletionResponse.class);
    }

    /**
     * 意图：从抖宝同步响应中提取首个助手消息文本。
     */
    private String extractAssistantContent(ChatCompletionResponse response) {
        if (response == null || response.getChoices() == null) {
            log.warn("Doubao aggregated response missing choices - returning empty content");
            return "";
        }
        return response
            .getChoices()
            .stream()
            .map(ChatCompletionResponse.Choice::getMessage)
            .filter(Objects::nonNull)
            .map(ChatCompletionResponse.Message::getContent)
            .filter(Objects::nonNull)
            .findFirst()
            .orElse("");
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

    private String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String ensureLeadingSlash(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        return path.startsWith("/") ? path : "/" + path;
    }

    private String maskKey(String key) {
        if (key.length() <= 8) {
            return "****";
        }
        int end = key.length() - 4;
        return key.substring(0, 4) + "****" + key.substring(end);
    }
}
