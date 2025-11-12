package com.glancy.backend.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.llm.llm.DictionaryModelRequestOptions;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.model.ChatRole;
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

  private static final BodyInserter.Context NO_OP_CONTEXT =
      new BodyInserter.Context() {
        private final List<HttpMessageWriter<?>> writers =
            ClientCodecConfigurer.create().getWriters();

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
  /**
   * 测试目标：确认默认配置下模型返回内容被正确解析。 前置条件：模拟 200 响应并注入默认 DoubaoClient。 步骤： 1) 调用 generateEntry 并捕获响应。 断言： -
   * 响应内容等于模拟返回的 assistant 内容。 边界/异常： - 若解析失败则断言不成立。
   */
  void GivenValidResponse_WhenGenerateEntry_ThenReturnAssistantContent() {
    ExchangeFunction ef = this::successResponse;
    client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties);
    String result = client.generateEntry(List.of(new ChatMessage(ChatRole.USER.role(), "hi")), 0.5);
    assertEquals("hi", result);
  }

  @Test
  /**
   * 测试目标：当服务端返回 401 时客户端应抛出 UnauthorizedException。 前置条件：模拟 401 响应并校验请求体携带默认 stream/thinking 设置。 步骤：
   * 1) 调用 generateEntry。 断言： - 抛出 UnauthorizedException。 边界/异常： - 若未抛出异常表示状态码处理失效。
   */
  void GivenUnauthorized_WhenGenerateEntry_ThenThrowUnauthorizedException() {
    ExchangeFunction ef =
        req -> {
          assertEquals(
              MediaType.APPLICATION_JSON_VALUE, req.headers().getFirst(HttpHeaders.ACCEPT));
          String requestBody = extractRequestBody(req);
          assertTrue(requestBody.contains("\"stream\":false"));
          assertTrue(requestBody.contains("\"thinking\":{\"type\":\"disabled\"}"));
          return Mono.just(ClientResponse.create(HttpStatus.UNAUTHORIZED).build());
        };
    client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties);
    assertThrows(
        com.glancy.backend.exception.UnauthorizedException.class,
        () -> client.generateEntry(List.of(new ChatMessage(ChatRole.USER.role(), "hi")), 0.5));
  }

  @Test
  /**
   * 测试目标：验证 5xx 响应路径抛出 BusinessException。 前置条件：模拟 500 响应。 步骤： 1) 调用 generateEntry。 断言： - 抛出
   * BusinessException。 边界/异常： - 若未抛出异常表示错误处理缺失。
   */
  void GivenServerError_WhenGenerateEntry_ThenThrowBusinessException() {
    ExchangeFunction ef =
        req -> Mono.just(ClientResponse.create(HttpStatus.INTERNAL_SERVER_ERROR).build());
    client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties);
    assertThrows(
        com.glancy.backend.exception.BusinessException.class,
        () -> client.generateEntry(List.of(new ChatMessage(ChatRole.USER.role(), "hi")), 0.5));
  }

  @Test
  /**
   * 测试目标：确保调用方可覆盖 thinkingType 参数。 前置条件：构造带有特定参数的 DictionaryModelRequestOptions。 步骤： 1) 调用
   * generateEntry 并检查请求体。 断言： - 请求体中的 thinking.type 匹配覆盖值。 边界/异常： - 若覆盖失败则断言不满足。
   */
  void GivenOptionsOverride_WhenGenerateEntry_ThenRespectOverrides() {
    ExchangeFunction ef =
        req -> {
          String body = extractRequestBody(req);
          assertTrue(body.contains("\"stream\":false"));
          assertTrue(body.contains("\"thinking\":{\"type\":\"detailed\"}"));
          return Mono.just(
              ClientResponse.create(HttpStatus.OK)
                  .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                  .body("{\"choices\":[]}")
                  .build());
        };
    client = new DoubaoClient(WebClient.builder().exchangeFunction(ef), properties);
    DictionaryModelRequestOptions options =
        DictionaryModelRequestOptions.builder().thinkingType("detailed").build();
    String result =
        client.generateEntry(List.of(new ChatMessage(ChatRole.USER.role(), "hi")), 0.5, options);
    assertEquals("", result);
  }

  private Mono<ClientResponse> successResponse(ClientRequest request) {
    assertEquals("http://mock/api/v3/chat/completions", request.url().toString());
    assertEquals("Bearer key", request.headers().getFirst(HttpHeaders.AUTHORIZATION));
    assertEquals(MediaType.APPLICATION_JSON_VALUE, request.headers().getFirst(HttpHeaders.ACCEPT));
    String requestBody = extractRequestBody(request);
    assertTrue(requestBody.contains("\"stream\":false"));
    assertTrue(requestBody.contains("\"thinking\":{\"type\":\"disabled\"}"));
    String body =
        String.format(
            "{\"choices\":[{\"message\":{\"role\":\"%s\",\"content\":\"hi\"}}]}",
            ChatRole.ASSISTANT.role());
    return Mono.just(
        ClientResponse.create(HttpStatus.OK)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .body(body)
            .build());
  }

  private String extractRequestBody(ClientRequest request) {
    MockClientHttpRequest mock = new MockClientHttpRequest(request.method(), request.url());
    request.body().insert(mock, NO_OP_CONTEXT).block();
    return mock.getBody()
        .map(
            dataBuffer -> {
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
