package com.glancy.backend.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.stream.DoubaoStreamDecoder;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** 集成测试，覆盖豆包客户端的流式解析与异常处理。 */
class DoubaoClientTest {

    private static final BodyInserter.Context NO_OP_CONTEXT = new BodyInserter.Context() {
        private final List<HttpMessageWriter<?>> writers = ClientCodecConfigurer.create().getWriters();

        @Override
        public @NonNull List<HttpMessageWriter<?>> messageWriters() {
            return writers;
        }

        @Override
        public @NonNull Optional<ServerHttpRequest> serverRequest() {
            return Optional.empty();
        }

        @Override
        public @NonNull Map<String, Object> hints() {
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

    /** 验证同步调用在收到完整流后聚合内容。 */
    @Test
    void chatReturnsContent() {
        ExchangeFunction ef = this::successResponse;
        client = new DoubaoClient(
            WebClient.builder().exchangeFunction(ef),
            properties,
            new DoubaoStreamDecoder(new ObjectMapper())
        );
        String result = client.chat(List.of(new ChatMessage("user", "hi")), 0.5);
        assertEquals("hi", result);
    }

    /** 验证 401 响应会抛出未授权异常。 */
    @Test
    void chatUnauthorizedThrowsException() {
        ExchangeFunction ef = req -> {
            assertEquals(MediaType.APPLICATION_JSON_VALUE, req.headers().getFirst(HttpHeaders.ACCEPT));
            assertTrue(extractRequestBody(req).contains("\"stream\":false"));
            return Mono.just(ClientResponse.create(HttpStatus.UNAUTHORIZED).build());
        };
        client = new DoubaoClient(
            WebClient.builder().exchangeFunction(ef),
            properties,
            new DoubaoStreamDecoder(new ObjectMapper())
        );
        assertThrows(com.glancy.backend.exception.UnauthorizedException.class, () ->
            client.chat(List.of(new ChatMessage("user", "hi")), 0.5)
        );
    }

    /** 验证流式接口逐片段输出并在 end 事件后结束。 */
    @Test
    void streamChatEmitsSegments() {
        ExchangeFunction ef = this::streamSuccessResponse;
        client = new DoubaoClient(
            WebClient.builder().exchangeFunction(ef),
            properties,
            new DoubaoStreamDecoder(new ObjectMapper())
        );
        Flux<String> flux = client.streamChat(List.of(new ChatMessage("u", "hi")), 0.5);
        StepVerifier.create(flux).expectNext("he").expectNext("llo").verifyComplete();
    }

    /** 验证 error 事件会终止流并抛出异常。 */
    @Test
    void streamChatErrorEvent() {
        ExchangeFunction ef = this::streamErrorResponse;
        client = new DoubaoClient(
            WebClient.builder().exchangeFunction(ef),
            properties,
            new DoubaoStreamDecoder(new ObjectMapper())
        );
        Flux<String> flux = client.streamChat(List.of(new ChatMessage("u", "hi")), 0.5);
        StepVerifier.create(flux).expectNext("hi").expectErrorMessage("boom").verify();
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

    private Mono<ClientResponse> streamSuccessResponse(ClientRequest request) {
        assertEquals(MediaType.TEXT_EVENT_STREAM_VALUE, request.headers().getFirst(HttpHeaders.ACCEPT));
        String requestBody = extractRequestBody(request);
        assertTrue(requestBody.contains("\"stream\":true"));
        String body = """
            event: message
            data: {"choices":[{"delta":{"messages":[{"content":"he"}]}}]}

            event: message
            data: {"choices":[{"delta":{"messages":[{"content":"llo"}]}}]}

            event: end
            data: {"code":0}

            """;
        return Mono.just(
            ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE)
                .body(body)
                .build()
        );
    }

    private Mono<ClientResponse> streamErrorResponse(ClientRequest request) {
        assertEquals(MediaType.TEXT_EVENT_STREAM_VALUE, request.headers().getFirst(HttpHeaders.ACCEPT));
        String requestBody = extractRequestBody(request);
        assertTrue(requestBody.contains("\"stream\":true"));
        String body = """
            event: message
            data: {"choices":[{"delta":{"messages":[{"content":"hi"}]}}]}

            event: error
            data: {"message":"boom"}

            """;
        return Mono.just(
            ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE)
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
