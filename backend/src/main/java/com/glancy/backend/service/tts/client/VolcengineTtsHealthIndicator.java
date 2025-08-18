package com.glancy.backend.service.tts.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.util.SensitiveDataUtil;
import java.net.URI;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Proactively verifies connectivity to Volcengine TTS.
 * Performs a minimal request at startup and on a fixed schedule.
 */
@Component
@Slf4j
public class VolcengineTtsHealthIndicator implements HealthIndicator {

    private final RestTemplate restTemplate;
    private final VolcengineTtsProperties props;
    private volatile Health lastHealth = Health.unknown().build();

    public VolcengineTtsHealthIndicator(RestTemplate restTemplate, VolcengineTtsProperties props) {
        this.restTemplate = restTemplate;
        this.props = props;
    }

    @Override
    public Health health() {
        return lastHealth;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        lastHealth = probe();
    }

    @Scheduled(fixedDelayString = "#{@volcengineTtsProperties.healthInterval.toMillis()}")
    public void scheduledProbe() {
        lastHealth = probe();
    }

    private Health probe() {
        String url = UriComponentsBuilder.fromHttpUrl(props.getApiUrl())
            .queryParam("Action", props.getAction())
            .queryParam("Version", props.getVersion())
            .toUriString();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        VolcengineTtsPayload payload = VolcengineTtsPayload.builder()
            .appId(props.getAppId())
            .voiceType(props.getVoiceType())
            .text("ping")
            .lang("en")
            .format("mp3")
            .speed(1.0)
            .build();

        String body;
        try {
            body = new ObjectMapper().writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize health payload", e);
            return Health.down(e).build();
        }
        VolcengineSigner.sign(headers, URI.create(url), body, props);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(url, entity, String.class);
            return Health.up().build();
        } catch (HttpStatusCodeException ex) {
            String resp = ex.getResponseBodyAsString();
            if (resp != null && (resp.contains("ServiceNotFound") || resp.contains("InvalidCredential"))) {
                log.error(
                    "Volcengine TTS health check failed status={} body={}",
                    ex.getStatusCode(),
                    SensitiveDataUtil.previewText(resp)
                );
            }
            return Health.down().withDetail("status", ex.getStatusCode().value()).build();
        } catch (RestClientException ex) {
            log.error("Volcengine TTS health check request failed", ex);
            return Health.down(ex).build();
        }
    }
}
