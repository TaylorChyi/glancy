package com.glancy.backend.client;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.exception.UnauthorizedException;
import com.glancy.backend.llm.model.ChatMessage;
import java.io.IOException;
import java.util.List;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

/** Tests for {@link DoubaoStreamClient}. */
class DoubaoStreamClientTest {

    private MockWebServer server;
    private DoubaoStreamClient client;

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        DoubaoProperties properties = new DoubaoProperties();
        properties.setBaseUrl(server.url("/").toString());
        properties.setChatPath("/v3/chat/completions");
        properties.setApiKey("key");
        properties.setModel("model");
        DoubaoStreamDecoder decoder = new DoubaoStreamDecoder(new ObjectMapper());
        client = new DoubaoStreamClient(WebClient.builder(), properties, decoder);
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    /**
     * Verify that streaming produces each fragment in order and completes on end event.
     */
    @Test
    void streamChatEmitsFragments() throws InterruptedException {
        String body = "event: message\n" +
            "data: {\"choices\":[{\"delta\":{\"content\":\"Hel\"}}]}\n\n" +
            "event: message\n" +
            "data: {\"choices\":[{\"delta\":{\"content\":\"lo\"}}]}\n\n" +
            "event: end\n" +
            "data: [DONE]\n\n";
        server.enqueue(new MockResponse().setHeader("Content-Type", "text/event-stream").setBody(body));

        Flux<String> flux = client.streamChat(List.of(new ChatMessage("user", "hi")), 0.5);
        StepVerifier.create(flux).expectNext("Hel").expectNext("lo").verifyComplete();

        RecordedRequest request = server.takeRequest();
        assertEquals("text/event-stream", request.getHeader("Accept"));
    }

    /**
     * Verify that unauthorized responses trigger {@link UnauthorizedException}.
     */
    @Test
    void streamChatUnauthorized() {
        server.enqueue(new MockResponse().setResponseCode(401));
        Flux<String> flux = client.streamChat(List.of(new ChatMessage("user", "hi")), 0.5);
        StepVerifier.create(flux).expectError(UnauthorizedException.class).verify();
    }
}
