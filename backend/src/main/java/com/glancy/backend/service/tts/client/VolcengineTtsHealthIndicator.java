package com.glancy.backend.service.tts.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
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

/**
 * Proactively verifies connectivity to Volcengine TTS. Performs a minimal request at startup and on
 * a fixed schedule.
 */
@Component
@Slf4j
public class VolcengineTtsHealthIndicator implements HealthIndicator {

    private final RestTemplate restTemplate;
    private final VolcengineTtsProperties props;
    private final ObjectMapper objectMapper;
    private volatile Health lastHealth = Health.unknown().build();

    public VolcengineTtsHealthIndicator(
            RestTemplate restTemplate, VolcengineTtsProperties props, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.props = props;
        this.objectMapper = objectMapper;
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
        try {
            String token = props.resolveAccessToken();
            HttpEntity<String> entity = new HttpEntity<>(serializePayload(token), buildHeaders(token));
            restTemplate.postForEntity(props.getApiUrl(), entity, String.class);
            return Health.up().build();
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize health payload", ex);
            return Health.down(ex).build();
        } catch (HttpStatusCodeException ex) {
            return handleHttpError(ex);
        } catch (RestClientException ex) {
            log.error("Volcengine TTS health check request failed", ex);
            return Health.down(ex).build();
        }
    }

    private HttpHeaders buildHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer; " + token);
        return headers;
    }

    private String serializePayload(String token) throws JsonProcessingException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("app", buildAppSection(token));
        payload.put("user", Map.of("uid", "health"));
        payload.put("audio", buildAudioSection());
        payload.put("request", buildRequestSection());
        return objectMapper.writeValueAsString(payload);
    }

    private Map<String, Object> buildAppSection(String token) {
        Map<String, Object> app = new LinkedHashMap<>();
        app.put("token", token);
        app.put("cluster", props.getCluster());
        app.put("appid", props.getAppId());
        return app;
    }

    private Map<String, Object> buildAudioSection() {
        Map<String, Object> audio = new LinkedHashMap<>();
        audio.put("voice_type", props.getVoiceType());
        audio.put("format", "mp3");
        audio.put("speed_ratio", 1.0);
        return audio;
    }

    private Map<String, Object> buildRequestSection() {
        Map<String, Object> req = new LinkedHashMap<>();
        req.put("reqid", UUID.randomUUID().toString());
        req.put("text", "ping");
        req.put("lang", "en");
        return req;
    }

    private Health handleHttpError(HttpStatusCodeException ex) {
        String resp = ex.getResponseBodyAsString();
        if (resp != null && (resp.contains("ServiceNotFound") || resp.contains("InvalidCredential"))) {
            log.error(
                    "Volcengine TTS health check failed status={} body={}",
                    ex.getStatusCode(),
                    SensitiveDataUtil.previewText(resp));
        }
        return Health.down().withDetail("status", ex.getStatusCode().value()).build();
    }
}
