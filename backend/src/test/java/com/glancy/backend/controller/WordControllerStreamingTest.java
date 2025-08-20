package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.glancy.backend.entity.Language;
import com.glancy.backend.service.SearchRecordService;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.WordService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.core.ParameterizedTypeReference;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

/**
 * 流式单词查询接口测试。
 * 流程：
 * 1. 模拟用户认证。
 * 2. 模拟 WordService 返回两段数据。
 * 3. 发送请求并验证 SSE 响应序列。
 */
@WebFluxTest(controllers = WordController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class WordControllerStreamingTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private WordService wordService;

    @MockBean
    private SearchRecordService searchRecordService;

    @MockBean
    private UserService userService;

    @Test
    void testStreamWord() {
        when(wordService.streamWordForUser(eq(1L), eq("hello"), eq(Language.ENGLISH), eq(null))).thenReturn(
            Flux.just("part1", "part2")
        );
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        Flux<String> body = webTestClient
            .get()
            .uri(uriBuilder ->
                uriBuilder
                    .path("/api/words/stream")
                    .queryParam("term", "hello")
                    .queryParam("language", "ENGLISH")
                    .build()
            )
            .header("X-USER-TOKEN", "tkn")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .exchange()
            .expectStatus()
            .isOk()
            .returnResult(String.class)
            .getResponseBody();

        StepVerifier.create(body).expectNext("part1", "part2").verifyComplete();
    }

    /**
     * 测试流式接口在服务抛出错误时能够返回错误事件。
     */
    @Test
    void testStreamWordError() {
        when(wordService.streamWordForUser(eq(1L), eq("hello"), eq(Language.ENGLISH), eq(null)))
            .thenReturn(Flux.error(new IllegalStateException("boom")));
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        Flux<ServerSentEvent<String>> body = webTestClient
            .get()
            .uri(uriBuilder ->
                uriBuilder
                    .path("/api/words/stream")
                    .queryParam("term", "hello")
                    .queryParam("language", "ENGLISH")
                    .build()
            )
            .header("X-USER-TOKEN", "tkn")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .exchange()
            .expectStatus()
            .isOk()
            .returnResult(new ParameterizedTypeReference<ServerSentEvent<String>>() {})
            .getResponseBody();

        StepVerifier
            .create(body)
            .expectNextMatches(evt -> "error".equals(evt.event()) && "boom".equals(evt.data()))
            .verifyComplete();
    }
}
