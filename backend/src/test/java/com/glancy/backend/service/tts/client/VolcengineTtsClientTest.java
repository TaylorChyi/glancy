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

/**
 * Verify that {@link VolcengineTtsClient} constructs requests containing
 * mandatory credentials required by the provider. The test ensures that the
 * default {@code Action} parameter is transmitted as a query parameter along with
 * authentication data.
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
     * configuration (voice) and the default action parameter as a query
     * parameter.
     */
    @Test
    void includesCredentialsInRequest() {
        server
            .expect(requestTo("http://localhost/tts?Action=TextToSpeech"))
            .andExpect(method(HttpMethod.POST))
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.appid").value("app"))
            .andExpect(jsonPath("$.access_token").value("token"))
            .andExpect(jsonPath("$.voice_type").value("v2"))
            .andRespond(
                withSuccess(
                    "{\"url\":\"u\",\"duration_ms\":1,\"format\":\"mp3\",\"from_cache\":false,\"object_key\":\"k\"}",
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
}
