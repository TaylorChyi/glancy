package com.glancy.backend.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.llm.model.ChatMessage;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ClientCodecConfigurer;
import org.springframework.http.codec.HttpMessageWriter;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.mock.http.client.reactive.MockClientHttpRequest;
import org.springframework.web.reactive.function.BodyInserter;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

class DoubaoClientTest {

    private static final BodyInserter.Context NO_OP_CONTEXT = new BodyInserter.Context() {
        private final List<HttpMessageWriter<?>> writers = ClientCodecConfigurer.create().getWriters();

        @Override
        @NonNull
        public List<HttpMessageWriter<?>> messageWriters() {
            return writers;
        }

        @Override
        @NonNull
        public Optional<ServerHttpRequest> serverRequest() {
            return Optional.empty();
        }

        @Override
        @NonNull
        public Map<String, Object> hints() {
            return Collections.emptyMap();
        }
    };

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
    void GivenValidResponse_WhenGenerateEntry_ThenReturnAssistantContent() {
        ExchangeFunction ef = this::successResponse;
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties);
        String result = client.generateEntry(List.of(new ChatMessage("user", "hi")), 0.5);
        assertEquals("hi", result);
    }

    @Test
    void GivenUnauthorized_WhenGenerateEntry_ThenThrowUnauthorizedException() {
        ExchangeFunction ef = req -> {
            assertEquals(MediaType.APPLICATION_JSON_VALUE, req.headers().getFirst(HttpHeaders.ACCEPT));
            assertTrue(extractRequestBody(req).contains("\"stream\":false"));
            return Mono.just(ClientResponse.create(HttpStatus.UNAUTHORIZED).build());
        };
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties);
        assertThrows(com.glancy.backend.exception.UnauthorizedException.class, () ->
            client.generateEntry(List.of(new ChatMessage("user", "hi")), 0.5)
        );
    }

    @Test
    void GivenServerError_WhenGenerateEntry_ThenThrowBusinessException() {
        ExchangeFunction ef = req -> Mono.just(ClientResponse.create(HttpStatus.INTERNAL_SERVER_ERROR).build());
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties);
        assertThrows(com.glancy.backend.exception.BusinessException.class, () ->
            client.generateEntry(List.of(new ChatMessage("user", "hi")), 0.5)
        );
    }

    private Mono<ClientResponse> successResponse(ClientRequest request) {
        assertEquals("http://mock/api/v3/chat/completions", request.url().toString());
        assertEquals("Bearer key", request.headers().getFirst(HttpHeaders.AUTHORIZATION));
        assertEquals(MediaType.APPLICATION_JSON_VALUE, request.headers().getFirst(HttpHeaders.ACCEPT));
        String requestBody = extractRequestBody(request);
        assertTrue(requestBody.contains("\"stream\":false"));
        String body = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"hi\"}}]}";
        return Mono.just(
            ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(body)
                .build()
        );
    }

    private String extractRequestBody(ClientRequest request) {
        MockClientHttpRequest mock = new MockClientHttpRequest(request.method(), request.url());
        request.body().insert(mock, NO_OP_CONTEXT).block();
        return mock
            .getBody()
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer);
                return new String(bytes, StandardCharsets.UTF_8);
            })
            .collectList()
            .map(list -> String.join("", list))
            .block();
    }
}
