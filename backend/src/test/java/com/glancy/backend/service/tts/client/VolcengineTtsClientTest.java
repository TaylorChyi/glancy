package com.glancy.backend.service.tts.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.exception.TtsFailedException;
import com.glancy.backend.service.tts.client.VolcengineTtsProperties;
import java.nio.charset.StandardCharsets;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

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
        props.setAccessKeyId("ak");
        props.setSecretKey("sk");
        props.setVoiceType("v1");
        props.setApiUrl("http://localhost/tts");
        client = new VolcengineTtsClient(restTemplate, props, () -> {});
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
            .expect(
                requestTo(
                    "http://localhost/tts?Action=" +
                    VolcengineTtsProperties.DEFAULT_ACTION +
                    "&Version=" +
                    VolcengineTtsProperties.DEFAULT_VERSION
                )
            )
            .andExpect(method(HttpMethod.POST))
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.appid").value("app"))
            .andExpect(jsonPath("$.voice_type").value("v2"))
            .andExpect(jsonPath("$.format").value("mp3"))
            .andExpect(jsonPath("$.speed").value(1.0))
            .andExpect(header(HttpHeaders.AUTHORIZATION, Matchers.notNullValue()))
            .andExpect(
                header(
                    HttpHeaders.AUTHORIZATION,
                    Matchers.containsString(
                        "/" +
                        VolcengineTtsProperties.DEFAULT_REGION +
                        "/" +
                        VolcengineTtsProperties.DEFAULT_SERVICE +
                        "/request"
                    )
                )
            )
            .andRespond(
                withSuccess(
                    "{\"data\":\"ZGF0YQ==\",\"duration_ms\":1,\"format\":\"mp3\",\"from_cache\":false}",
                    MediaType.APPLICATION_JSON
                )
            );

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");
        req.setVoice("v2");
        TtsResponse resp = client.synthesize(req);
        assertThat(resp.getFormat()).isEqualTo("mp3");
        assertThat(new String(resp.getData(), StandardCharsets.UTF_8)).isEqualTo("data");
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
        props.setAccessKeyId("ak");
        props.setSecretKey("sk");
        props.setVoiceType("v1");
        props.setApiUrl("http://localhost/tts");
        props.setVersion(null); // simulate missing
        VolcengineTtsClient localClient = new VolcengineTtsClient(restTemplate, props, () -> {});
        MockRestServiceServer localServer = MockRestServiceServer.createServer(restTemplate);

        localServer
            .expect(requestTo("http://localhost/tts?Action=" + VolcengineTtsProperties.DEFAULT_ACTION + "&Version="))
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
            .expect(requestTo("http://localhost/tts?Action=" + VolcengineTtsProperties.DEFAULT_ACTION))
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
            .expect(requestTo("http://localhost/tts?Action=" + VolcengineTtsProperties.DEFAULT_ACTION))
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

    @Test
    void refreshesCredentialsOnInvalidCredential() {
        VolcengineCredentialRefresher refresher = mock(VolcengineCredentialRefresher.class);
        RestTemplate restTemplate = new RestTemplate();
        VolcengineTtsProperties props = new VolcengineTtsProperties();
        props.setAppId("app");
        props.setAccessKeyId("ak");
        props.setSecretKey("sk");
        props.setVoiceType("v1");
        props.setApiUrl("http://localhost/tts");
        VolcengineTtsClient localClient = new VolcengineTtsClient(restTemplate, props, refresher);
        MockRestServiceServer localServer = MockRestServiceServer.createServer(restTemplate);

        localServer
            .expect(requestTo("http://localhost/tts?Action=" + VolcengineTtsProperties.DEFAULT_ACTION))
            .andExpect(method(HttpMethod.POST))
            .andRespond(
                withBadRequest()
                    .body("{\"ResponseMetadata\":{\"Error\":{\"Code\":\"InvalidCredential\"}}}")
                    .contentType(MediaType.APPLICATION_JSON)
            );

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> localClient.synthesize(req)).isInstanceOf(TtsFailedException.class);

        localServer.verify();
        verify(refresher).refresh();
    }

    /**
     * Network failures should surface underlying messages so that operators
     * can quickly diagnose upstream issues.
     */
    @Test
    void networkFailureContainsCauseMessage() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        VolcengineTtsProperties props = new VolcengineTtsProperties();
        props.setAppId("app");
        props.setAccessKeyId("ak");
        props.setSecretKey("sk");
        props.setVoiceType("v1");
        props.setApiUrl("http://localhost/tts");
        when(restTemplate.postForEntity(anyString(), any(), eq(TtsResponse.class))).thenThrow(
            new ResourceAccessException("timeout")
        );
        VolcengineTtsClient failingClient = new VolcengineTtsClient(restTemplate, props, () -> {});

        TtsRequest req = new TtsRequest();
        req.setText("hi");
        req.setLang("en");

        assertThatThrownBy(() -> failingClient.synthesize(req))
            .isInstanceOf(TtsFailedException.class)
            .hasMessageContaining("timeout");
    }
}
