package com.glancy.backend.service.tts.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.exception.TtsFailedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

/**
 * Verify that {@link VolcengineTtsClient} constructs requests containing
 * mandatory credentials required by the provider. Tests cover presence of query
 * parameters such as {@code Action} and {@code Version} alongside authentication
 * data.
 */
class VolcengineTtsClientTest {

    private MockRestServiceServer server;
    private VolcengineTtsClient client;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        VolcengineTtsProperties props = new VolcengineTtsProperties();
        props.setAppId("app");
        props.setAccessToken("token");
        props.setVoiceType("v1");
        props.setApiUrl("http://localhost/tts");
        client = new VolcengineTtsClient(restTemplate, props);
        server = MockRestServiceServer.createServer(restTemplate);
    }

    /**
     * Ensures {@link VolcengineTtsClient#synthesize} sends authentication,
     * configuration (voice) and required query parameters including {@code Action}
     * and {@code Version}.
     */
    @Test
    void includesCredentialsInRequest() {
        server
            .expect(requestTo("http://localhost/tts?Action=TextToSpeech&Version=2020-06-09"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.appid").value("app"))
            .andExpect(jsonPath("$.access_token").value("token"))
            .andExpect(jsonPath("$.voice_type").value("v2"))
            .andExpect(jsonPath("$.format").value("mp3"))
            .andExpect(jsonPath("$.speed").value(1.0))
            .andRespond(
                withSuccess(
                    "{\"url\":\"u\",\"duration_ms\":1,\"format\":\"mp3\",\"from_cache\":false}",
                    MediaType.APPLICATION_JSON
                )
            );

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");
        req.setVoice("v2");
        TtsResponse resp = client.synthesize(req);
        assertThat(resp.getUrl()).isEqualTo("u");
        server.verify();
    }

    /**
     * Simulates missing {@code Version} configuration to ensure error messages
     * from the provider are surfaced to callers.
     */
    @Test
    void missingVersionProducesClearError() {
        RestTemplate restTemplate = new RestTemplate();
        VolcengineTtsProperties props = new VolcengineTtsProperties();
        props.setAppId("app");
        props.setAccessToken("token");
        props.setVoiceType("v1");
        props.setApiUrl("http://localhost/tts");
        props.setVersion(null); // simulate missing
        VolcengineTtsClient localClient = new VolcengineTtsClient(restTemplate, props);
        MockRestServiceServer localServer = MockRestServiceServer.createServer(restTemplate);

        localServer
            .expect(requestTo("http://localhost/tts?Action=TextToSpeech&Version="))
            .andExpect(method(HttpMethod.POST))
            .andRespond(
                withBadRequest()
                    .body("{\"code\":\"E400\",\"message\":\"Version is required\"}")
                    .contentType(MediaType.APPLICATION_JSON)
            );

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> localClient.synthesize(req))
            .isInstanceOf(TtsFailedException.class)
            .hasMessageContaining("Version is required");

        localServer.verify();
    }

    @Test
    void wrapsClientErrorsFromProvider() {
        server
            .expect(requestTo("http://localhost/tts?Action=TextToSpeech"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(
                withBadRequest()
                    .body("{\"code\":\"E400\",\"message\":\"bad request\"}")
                    .contentType(MediaType.APPLICATION_JSON)
            );

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> client.synthesize(req))
            .isInstanceOf(TtsFailedException.class)
            .hasMessageContaining("status=400")
            .hasMessageContaining("E400");

        server.verify();
    }

    @Test
    void wrapsServerErrorsFromProvider() {
        server
            .expect(requestTo("http://localhost/tts?Action=TextToSpeech"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(
                withServerError()
                    .body("{\"code\":\"E500\",\"message\":\"boom\"}")
                    .contentType(MediaType.APPLICATION_JSON)
            );

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> client.synthesize(req))
            .isInstanceOf(TtsFailedException.class)
            .hasMessageContaining("status=500")
            .hasMessageContaining("E500");

        server.verify();
    }

    /**
     * Simulates a network level failure to ensure the resulting
     * {@link TtsFailedException} contains the underlying cause
     * message for easier troubleshooting.
     */
    @Test
    void networkFailureProducesClearMessage() {
        server
            .expect(requestTo("http://localhost/tts?Action=TextToSpeech"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(r -> {
                throw new RestClientException("connection reset");
            });

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> client.synthesize(req))
            .isInstanceOf(TtsFailedException.class)
            .hasMessageContaining("connection reset");

        server.verify();
    }
}
