package com.glancy.backend.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class DoubaoClientTest {

    private MockRestServiceServer server;
    private DoubaoClient client;
    private DoubaoProperties properties;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        properties = new DoubaoProperties();
        properties.setBaseUrl("http://mock");
        properties.setChatPath("/api/v3/chat/completions");
        properties.setApiKey(" key ");
        properties.setModel("test-model");
        client = new DoubaoClient(restTemplate, properties);
    }

    @Test
    void chatReturnsContent() {
        String json = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"hi\"}}]}";
        server
            .expect(requestTo("http://mock" + properties.getChatPath()))
            .andExpect(method(POST))
            .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer key"))
            .andExpect(jsonPath("$.model").value("test-model"))
            .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        String result = client.chat(List.of(new ChatMessage("user", "hi")), 0.5);
        assertEquals("hi", result);
        server.verify();
    }

    @Test
    void chatUnauthorizedThrowsException() {
        server
            .expect(requestTo("http://mock" + properties.getChatPath()))
            .andExpect(method(POST))
            .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThrows(com.glancy.backend.exception.UnauthorizedException.class, () ->
            client.chat(List.of(new ChatMessage("user", "hi")), 0.5)
        );
        server.verify();
    }
}
