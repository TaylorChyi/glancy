package com.glancy.backend.service.tts.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * Tests for {@link VolcengineTtsHealthIndicator}. Ensures both healthy and error scenarios are
 * handled.
 */
class VolcengineTtsHealthIndicatorTest {

  private RestTemplate restTemplate;
  private VolcengineTtsProperties props;
  private VolcengineTtsHealthIndicator indicator;

  @BeforeEach
  void setup() {
    restTemplate = mock(RestTemplate.class);
    props = new VolcengineTtsProperties();
    props.setAppId("app");
    props.setAccessKeyId("ak");
    props.setSecretKey("sk");
    props.setVoiceType("voice");
    indicator = new VolcengineTtsHealthIndicator(restTemplate, props);
  }

  /** Verifies a 2xx response marks the health as UP. */
  @Test
  void healthUpOn2xx() {
    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
        .thenReturn(ResponseEntity.ok("{}"));
    indicator.scheduledProbe();
    assertThat(indicator.health().getStatus()).isEqualTo(Status.UP);
  }

  /** Verifies error responses containing InvalidCredential mark health DOWN. */
  @Test
  void healthDownOnCredentialError() {
    HttpClientErrorException ex =
        new HttpClientErrorException(
            HttpStatus.FORBIDDEN,
            "Forbidden",
            "{\"Code\":\"InvalidCredential\"}".getBytes(StandardCharsets.UTF_8),
            StandardCharsets.UTF_8);
    when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
        .thenThrow(ex);
    indicator.scheduledProbe();
    assertThat(indicator.health().getStatus()).isEqualTo(Status.DOWN);
  }
}
