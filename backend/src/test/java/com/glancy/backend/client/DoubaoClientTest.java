package com.glancy.backend.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.stream.DoubaoEventType;
import com.glancy.backend.llm.stream.DoubaoStreamDecoder;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** 集成测试，覆盖抖宝客户端的流式解析与异常处理。 */
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

    /** 验证同步调用在收到完整流后聚合内容。 */
    @Test
    void chatReturnsContent() {
        ExchangeFunction ef = this::successResponse;
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties, new DoubaoStreamDecoder());
        String result = client.chat(List.of(new ChatMessage("user", "hi")), 0.5);
        assertEquals("hi", result);
    }

    /** 验证 401 响应会抛出未授权异常。 */
    @Test
    void chatUnauthorizedThrowsException() {
        ExchangeFunction ef = req -> Mono.just(ClientResponse.create(HttpStatus.UNAUTHORIZED).build());
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties, new DoubaoStreamDecoder());
        assertThrows(com.glancy.backend.exception.UnauthorizedException.class, () ->
            client.chat(List.of(new ChatMessage("user", "hi")), 0.5)
        );
    }

    /** 验证流式接口逐片段输出并在 end 事件后结束。 */
    @Test
    void streamChatEmitsSegments() {
        ExchangeFunction ef = this::streamSuccessResponse;
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties, new DoubaoStreamDecoder());
        Flux<String> flux = client.streamChat(List.of(new ChatMessage("u", "hi")), 0.5);
        StepVerifier.create(flux).expectNext("he").expectNext("llo").verifyComplete();
    }

    /** 验证 error 事件会终止流并抛出异常。 */
    @Test
    void streamChatErrorEvent() {
        ExchangeFunction ef = this::streamErrorResponse;
        client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties, new DoubaoStreamDecoder());
        Flux<String> flux = client.streamChat(List.of(new ChatMessage("u", "hi")), 0.5);
        StepVerifier.create(flux).expectNext("hi").expectErrorMessage("boom").verify();
    }

    private Mono<ClientResponse> successResponse(ClientRequest request) {
        assertEquals("http://mock/api/v3/chat/completions", request.url().toString());
        assertEquals("Bearer key", request.headers().getFirst(HttpHeaders.AUTHORIZATION));
        String body = """
            event: %s
            data: {"choices":[{"delta":{"content":"hi"}}]}

            event: %s
            data: {"code":0}

            """.formatted(DoubaoEventType.MESSAGE.value(), DoubaoEventType.END.value());
        return Mono.just(
            ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE)
                .body(body)
                .build()
        );
    }

    private Mono<ClientResponse> streamSuccessResponse(ClientRequest request) {
        String body = """
            event: %s
            data: {"choices":[{"delta":{"content":"he"}}]}

            event: %s
            data: {"choices":[{"delta":{"content":"llo"}}]}

            event: %s
            data: {"code":0}

            """.formatted(
                DoubaoEventType.MESSAGE.value(),
                DoubaoEventType.MESSAGE.value(),
                DoubaoEventType.END.value()
            );
        return Mono.just(
            ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE)
                .body(body)
                .build()
        );
    }

    private Mono<ClientResponse> streamErrorResponse(ClientRequest request) {
        String body = """
            event: %s
            data: {"choices":[{"delta":{"content":"hi"}}]}

            event: %s
            data: {"message":"boom"}

            """.formatted(DoubaoEventType.MESSAGE.value(), DoubaoEventType.ERROR.value());
        return Mono.just(
            ClientResponse.create(HttpStatus.OK)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_EVENT_STREAM_VALUE)
                .body(body)
                .build()
        );
    }
}
