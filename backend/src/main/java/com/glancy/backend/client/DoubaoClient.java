package com.glancy.backend.client;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.stream.StreamDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

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
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("temperature", temperature);
        body.put("stream", true);

        List<Map<String, String>> reqMessages = new ArrayList<>();
        for (ChatMessage m : messages) {
            reqMessages.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }
        body.put("messages", reqMessages);

        return webClient
            .post()
            .uri(chatPath)
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.TEXT_EVENT_STREAM)
            .headers(h -> {
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
                return Flux.error(new com.glancy.backend.exception.UnauthorizedException("Invalid Doubao API key"));
            }
            return Flux.error(
                new com.glancy.backend.exception.BusinessException(
                    "Failed to call Doubao API: " + resp.statusCode(),
                    null
                )
            );
        }
        return resp.bodyToFlux(String.class);
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
