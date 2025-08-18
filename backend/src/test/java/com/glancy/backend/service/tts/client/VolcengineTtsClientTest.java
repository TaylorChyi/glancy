package com.glancy.backend.service.tts.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.exception.TtsFailedException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

class VolcengineTtsClientTest {

    private MockRestServiceServer server;
    private VolcengineTtsClient client;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        VolcengineTtsProperties props = new VolcengineTtsProperties();
        props.setAppId("app");
        props.setToken("tok");
        props.setCluster("cluster");
        props.setVoiceType("v1");
        props.setApiUrl("http://localhost/tts");
        client = new VolcengineTtsClient(restTemplate, props);
        server = MockRestServiceServer.createServer(restTemplate);
    }

    @Test
    void includesCredentialsInRequest() {
        server
            .expect(requestTo("http://localhost/tts"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer; tok"))
            .andExpect(jsonPath("$.app.appid").value("app"))
            .andExpect(jsonPath("$.app.token").value("tok"))
            .andExpect(jsonPath("$.app.cluster").value("cluster"))
            .andExpect(jsonPath("$.user.uid").value("123"))
            .andExpect(jsonPath("$.audio.voice_type").value("v2"))
            .andExpect(jsonPath("$.request.text").value("hi"))
            .andExpect(jsonPath("$.request.operation").value("query"))
            .andRespond(
                withSuccess("{\"data\":\"ZGF0YQ==\",\"addition\":{\"duration\":1}}", MediaType.APPLICATION_JSON)
            );

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");
        req.setVoice("v2");
        TtsResponse resp = client.synthesize(123L, req);
        assertThat(new String(resp.getData(), StandardCharsets.UTF_8)).isEqualTo("data");
        assertThat(resp.getDurationMs()).isEqualTo(1);
        server.verify();
    }

    @Test
    void wrapsClientErrorsFromProvider() {
        server
            .expect(requestTo("http://localhost/tts"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withBadRequest().body("{\"code\":\"E400\"}").contentType(MediaType.APPLICATION_JSON));

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> client.synthesize(1L, req))
            .isInstanceOf(TtsFailedException.class)
            .hasMessageContaining("status=400");

        server.verify();
    }

    @Test
    void wrapsServerErrorsFromProvider() {
        server
            .expect(requestTo("http://localhost/tts"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withServerError().body("{\"code\":\"E500\"}").contentType(MediaType.APPLICATION_JSON));

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> client.synthesize(1L, req))
            .isInstanceOf(TtsFailedException.class)
            .hasMessageContaining("status=500");

        server.verify();
    }

    @Test
    void networkFailureContainsCauseMessage() {
        RestTemplate restTemplate = org.mockito.Mockito.mock(RestTemplate.class);
        VolcengineTtsProperties props = new VolcengineTtsProperties();
        props.setAppId("app");
        props.setToken("tok");
        props.setCluster("cluster");
        props.setVoiceType("v1");
        props.setApiUrl("http://localhost/tts");
        org.mockito.Mockito.when(
            restTemplate.postForEntity(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.eq(ObjectNode.class)
            )
        ).thenThrow(new ResourceAccessException("timeout"));
        VolcengineTtsClient failingClient = new VolcengineTtsClient(restTemplate, props);

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> failingClient.synthesize(1L, req))
            .isInstanceOf(TtsFailedException.class)
            .hasMessageContaining("timeout");
    }
}
