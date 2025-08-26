package com.glancy.backend.client;

import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.parser.StreamDecoder;
import java.io.IOException;
import java.util.List;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

class DeepSeekStreamClientTest {

  private MockWebServer server;
  private DeepSeekStreamClient client;

  @BeforeEach
  void setUp() throws IOException {
    server = new MockWebServer();
    server.start();
    WebClient.Builder builder = WebClient.builder();
    client =
        new DeepSeekStreamClient(builder, server.url("/").toString(), "key", new StreamDecoder());
  }

  @AfterEach
  void tearDown() throws IOException {
    server.shutdown();
  }

  /** 测试连续流片段能够顺序解析并在收到 [DONE] 后结束。 */
  @Test
  void streamChatEmitsChunksUntilDone() {
    String body =
        "data: {\"choices\":[{\"delta\":{\"content\":\"你\"}}]}\n\n"
            + "data: {\"choices\":[{\"delta\":{\"content\":\"好\"}}]}\n\n"
            + "data: [DONE]\n\n";
    server.enqueue(new MockResponse().addHeader("Content-Type", "text/event-stream").setBody(body));

    Flux<String> flux = client.streamChat(List.of(new ChatMessage("user", "hi")), 0.5);
    StepVerifier.create(flux).expectNext("你").expectNext("好").verifyComplete();
  }

  /** 测试错误流事件会被忽略并继续处理后续片段。 */
  @Test
  void streamChatHandlesMalformedJson() {
    String body =
        "data: {\"choices\":[{\"delta\":{\"content\":\"a\"}}]}\n\n"
            + "data: {bad json}\n\n"
            + "data: [DONE]\n\n";
    server.enqueue(new MockResponse().addHeader("Content-Type", "text/event-stream").setBody(body));

    Flux<String> flux = client.streamChat(List.of(new ChatMessage("user", "hi")), 0.5);
    StepVerifier.create(flux).expectNext("a").verifyComplete();
  }
}
