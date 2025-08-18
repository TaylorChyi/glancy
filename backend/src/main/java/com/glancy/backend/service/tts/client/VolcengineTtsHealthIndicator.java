package com.glancy.backend.service.tts.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.util.SensitiveDataUtil;
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
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

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
        String url = props.getApiUrl();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer; " + props.getToken());

        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> app = new LinkedHashMap<>();
        app.put("token", props.getToken());
        app.put("cluster", props.getCluster());
        app.put("appid", props.getAppId());
        body.put("app", app);

        body.put("user", Map.of("uid", "health"));

        Map<String, Object> audio = new LinkedHashMap<>();
        audio.put("voice_type", props.getVoiceType());
        audio.put("format", "mp3");
        audio.put("speed_ratio", 1.0);
        body.put("audio", audio);

        Map<String, Object> req = new LinkedHashMap<>();
        req.put("reqid", UUID.randomUUID().toString());
        req.put("text", "ping");
        req.put("lang", "en");
        body.put("request", req);

        String json;
        try {
            json = new ObjectMapper().writeValueAsString(body);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize health payload", e);
            return Health.down(e).build();
        }
        HttpEntity<String> entity = new HttpEntity<>(json, headers);

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
