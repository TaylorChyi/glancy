package com.glancy.backend.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.stream.SseStreamDecoder;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

class DoubaoClientTest {

    private DoubaoClient client;
    private DoubaoProperties properties;

    @BeforeEach
    void setUp() {
        properties = new DoubaoProperties();
        properties.setBaseUrl("http://mock");
        properties.setChatPath("/api/v3/chat/completions");
        properties.setApiKey(" key ");
        properties.setModel("test-model");
    }

    @Test
    void chatReturnsContent() {
        ExchangeFunction ef = this::successResponse;
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties, new SseStreamDecoder());
        String result = client.chat(List.of(new ChatMessage("user", "hi")), 0.5);
        assertEquals("hi", result);
    }

    @Test
    void chatUnauthorizedThrowsException() {
        ExchangeFunction ef = req -> Mono.just(ClientResponse.create(HttpStatus.UNAUTHORIZED).build());
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties, new SseStreamDecoder());
        assertThrows(
            com.glancy.backend.exception.UnauthorizedException.class,
            () -> client.chat(List.of(new ChatMessage("user", "hi")), 0.5)
        );
    }

    private Mono<ClientResponse> successResponse(ClientRequest request) {
        assertEquals("http://mock/api/v3/chat/completions", request.url().toString());
        assertEquals("Bearer key", request.headers().getFirst(HttpHeaders.AUTHORIZATION));
        String body =
            "data: {\"choices\":[{\"delta\":{\"content\":\"hi\"}}]}\n\n" +
            "data: [DONE]\n\n";
        return Mono.just(
            ClientResponse
                .create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE)
                .body(body)
                .build()
        );
    }
}
