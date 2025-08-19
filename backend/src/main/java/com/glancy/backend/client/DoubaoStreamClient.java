package com.glancy.backend.client;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.exception.BusinessException;
import com.glancy.backend.exception.UnauthorizedException;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.util.UrlUtils;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive client for Doubao chat completions using Server-Sent Events.
 */
@Component
public class DoubaoStreamClient {

    private final WebClient webClient;
    private final DoubaoStreamDecoder decoder;
    private final String chatPath;
    private final String model;

    public DoubaoStreamClient(
        WebClient.Builder builder,
        DoubaoProperties properties,
        DoubaoStreamDecoder decoder
    ) {
        String baseUrl = UrlUtils.trimTrailingSlash(properties.getBaseUrl());
        this.chatPath = UrlUtils.ensureLeadingSlash(properties.getChatPath());
        this.model = properties.getModel();
        this.decoder = decoder;
        String apiKey = properties.getApiKey() == null ? null : properties.getApiKey().trim();
        this.webClient = builder
            .baseUrl(baseUrl)
            .defaultHeader(HttpHeaders.AUTHORIZATION, apiKey == null ? "" : "Bearer " + apiKey)
            .build();
    }

    /**
     * Streams chat completions from Doubao API.
     *
     * @param messages conversation history
     * @param temperature randomness parameter
     * @return flux of response segments
     */
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
            .bodyValue(body)
            .retrieve()
            .onStatus(
                status -> status.value() == 401,
                resp -> Mono.error(new UnauthorizedException("Invalid Doubao API key"))
            )
            .onStatus(
                status -> status.isError(),
                resp -> Mono.error(new BusinessException("Failed to call Doubao API: " + resp.statusCode()))
            )
            .bodyToFlux(String.class)
            .transform(decoder::decode);
    }
}
