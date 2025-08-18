package com.glancy.backend.service.tts.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
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
    private final ObjectMapper mapper = new ObjectMapper();

    public VolcengineTtsClient(RestTemplate restTemplate, VolcengineTtsProperties props) {
        this.restTemplate = restTemplate;
        this.props = props;
    }

    /**
     * Perform a synthesis request.
     *
     * @param userId  identifier of the requesting user
     * @param request synthesis parameters
     * @return response from remote service
     */
    public TtsResponse synthesize(Long userId, TtsRequest request) {
        String voice = request.getVoice() != null ? request.getVoice() : props.getVoiceType();
        String reqId = UUID.randomUUID().toString();

        String token = props.resolveToken();
        if (VolcengineTtsProperties.FAKE_TOKEN.equals(token)) {
            log.warn("Volcengine TTS token not configured; using placeholder token");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> app = new LinkedHashMap<>();
        app.put("token", token);
        app.put("cluster", props.getCluster());
        app.put("appid", props.getAppId());
        body.put("app", app);

        body.put("user", Map.of("uid", String.valueOf(userId)));

        Map<String, Object> audio = new LinkedHashMap<>();
        audio.put("voice_type", voice);
        audio.put("encoding", request.getFormat());
        audio.put("speed_ratio", request.getSpeed());
        audio.put("explicit_language", request.getLang());
        body.put("audio", audio);

        Map<String, Object> req = new LinkedHashMap<>();
        req.put("reqid", reqId);
        req.put("text", request.getText());
        req.put("operation", request.getOperation().apiValue());
        body.put("request", req);

        logPayload(body);

        String bodyJson;
        try {
            bodyJson = mapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize TTS payload", e);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer; " + token);
        HttpEntity<String> entity = new HttpEntity<>(bodyJson, headers);

        try {
            ResponseEntity<ObjectNode> resp = restTemplate.postForEntity(props.getApiUrl(), entity, ObjectNode.class);
            ObjectNode node = resp.getBody();

            if (!resp.getStatusCode().is2xxSuccessful() || node == null) {
                log.warn(
                    "Volcengine TTS returned unexpected response: status={} bodyNull={}",
                    resp.getStatusCode(),
                    node == null
                );
                throw new IllegalStateException(
                    "Upstream TTS (Text-To-Speech) returned empty body or non-2xx status: " + resp.getStatusCode()
                );
            }

            String dataB64 = node.path("data").asText();
            byte[] audioBytes = Base64.getDecoder().decode(dataB64);
            long duration = node.path("addition").path("duration").asLong();
            TtsResponse result = new TtsResponse(audioBytes, duration, request.getFormat(), false);

            log.debug(
                "Received response from {} status={} durationMs={}",
                props.getApiUrl(),
                resp.getStatusCode(),
                duration
            );
            return result;
        } catch (RestClientException ex) {
            String msg = "Upstream TTS (Text-To-Speech) request failed";
            if (ex instanceof HttpStatusCodeException statusEx) {
                msg += " status=" + statusEx.getStatusCode().value();
                String bodyResp = statusEx.getResponseBodyAsString();
                if (bodyResp != null && !bodyResp.isBlank()) {
                    msg += " body=" + SensitiveDataUtil.previewText(bodyResp);
                }
            } else if (ex.getMessage() != null) {
                msg += " msg=" + ex.getMessage();
            }
            log.error("HTTP (HyperText Transfer Protocol) request to {} failed: {}", props.getApiUrl(), msg, ex);
            throw new com.glancy.backend.exception.TtsFailedException(msg);
        }
    }

    private void logPayload(Map<String, Object> payload) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        Object appid = ((Map<?, ?>) payload.get("app")).get("appid");
        sanitized.put("appid", sanitize("appid", appid));
        Object voiceType = ((Map<?, ?>) payload.get("audio")).get("voice_type");
        sanitized.put("voice_type", sanitize("voice_type", voiceType));
        Object uid = ((Map<?, ?>) payload.get("user")).get("uid");
        sanitized.put("uid", sanitize("uid", uid));
        Object lang = ((Map<?, ?>) payload.get("audio")).get("explicit_language");
        sanitized.put("lang", sanitize("lang", lang));
        log.info("Resolved TTS parameters {}", sanitized);
    }

    private Object sanitize(String key, Object value) {
        if (value == null) {
            return null;
        }
        String str = String.valueOf(value);
        return switch (key) {
            case "appid" -> SensitiveDataUtil.maskCredential(str);
            case "uid" -> SensitiveDataUtil.maskCredential(str);
            case "text" -> SensitiveDataUtil.previewText(str);
            default -> str;
        };
    }

    /** Returns default voice configured for the service. */
    public String getDefaultVoice() {
        return props.getVoiceType();
    }
}
