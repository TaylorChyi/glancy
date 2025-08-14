package com.glancy.backend.service.tts.client;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Low level HTTP client for interacting with Volcengine TTS service.
 * Credentials and endpoint are provided via {@link VolcengineTtsProperties}.
 * The client is intentionally lean, delegating higher level concerns to
 * service layer components.
 */
@Component
@Slf4j
public class VolcengineTtsClient {

    private final RestTemplate restTemplate;
    private final VolcengineTtsProperties props;

    @Autowired
    public VolcengineTtsClient(RestTemplateBuilder builder, VolcengineTtsProperties props) {
        this(builder.build(), props);
    }

    VolcengineTtsClient(RestTemplate restTemplate, VolcengineTtsProperties props) {
        this.restTemplate = restTemplate;
        this.props = props;
    }

    /**
     * Perform a synthesis request.
     *
     * @param request synthesis parameters
     * @return response from remote service
     */
    public TtsResponse synthesize(TtsRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("appid", props.getAppId());
        payload.put("access_token", props.getAccessToken());
        payload.put("action", props.getAction());
        String voice = StringUtils.hasText(request.getVoice()) ? request.getVoice() : props.getVoiceType();
        payload.put("voice_type", voice);
        payload.put("text", request.getText());
        payload.put("lang", request.getLang());
        payload.put("format", request.getFormat());
        payload.put("speed", request.getSpeed());

        logPayload(payload);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        try {
            ResponseEntity<TtsResponse> resp = restTemplate.postForEntity(props.getApiUrl(), entity, TtsResponse.class);
            TtsResponse body = resp.getBody();

            if (!resp.getStatusCode().is2xxSuccessful() || body == null) {
                log.warn(
                    "Volcengine TTS returned unexpected response: status={}, bodyNull={}",
                    resp.getStatusCode(),
                    body == null
                );
                throw new IllegalStateException(
                    "Upstream TTS (Text-To-Speech) returned empty body or non-2xx status: " + resp.getStatusCode()
                );
            }

            log.debug(
                "Received response from {} status={} durationMs={}",
                props.getApiUrl(),
                resp.getStatusCode(),
                body.getDurationMs()
            );
            return body;
        } catch (RestClientException ex) {
            String msg = "Upstream TTS (Text-To-Speech) request failed";
            if (ex instanceof HttpStatusCodeException statusEx) {
                msg += " status=" + statusEx.getStatusCode().value();
                String body = statusEx.getResponseBodyAsString();
                if (StringUtils.hasText(body)) {
                    msg += " body=" + SensitiveDataUtil.previewText(body);
                }
            } else if (StringUtils.hasText(ex.getMessage())) {
                msg += " msg=" + ex.getMessage();
            }
            log.error("HTTP (HyperText Transfer Protocol) request to {} failed: {}", props.getApiUrl(), msg, ex);
            throw new com.glancy.backend.exception.TtsFailedException(msg);
        }
    }

    private void logPayload(Map<String, Object> payload) {
        List<String> required = List.of("appid", "access_token", "action", "voice_type", "text", "lang");
        List<String> missing = new ArrayList<>();
        Map<String, Object> sanitized = new LinkedHashMap<>();
        payload.forEach((k, v) -> {
            boolean hasValue = v != null && (!(v instanceof String) || StringUtils.hasText((String) v));
            if (required.contains(k) && !hasValue) {
                missing.add(k);
            } else {
                sanitized.put(k, sanitize(k, v));
            }
        });
        if (!missing.isEmpty()) {
            log.warn("Missing required parameters for TTS model call: {}", missing);
        } else {
            log.debug("Calling TTS model with parameters {}", sanitized);
        }
    }

    private Object sanitize(String key, Object value) {
        if (value == null) {
            return null;
        }
        String str = String.valueOf(value);
        switch (key) {
            case "appid":
            case "access_token":
                return SensitiveDataUtil.maskCredential(str);
            case "text":
                return SensitiveDataUtil.previewText(str);
            default:
                return str;
        }
    }

    /** Returns default voice configured for the service. */
    public String getDefaultVoice() {
        return props.getVoiceType();
    }
}
