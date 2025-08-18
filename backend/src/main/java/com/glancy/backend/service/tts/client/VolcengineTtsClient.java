package com.glancy.backend.service.tts.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
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
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Low level HTTP client for interacting with Volcengine TTS service.
 * Endpoint and defaults are provided via {@link VolcengineTtsProperties}.
 * The client remains intentionally lean, delegating higher level concerns to
 * service layer components.
 */
@Component
@Slf4j
public class VolcengineTtsClient {

    private static final Pattern VERSION_PATTERN = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");

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
        String version = props.getVersion();
        if (!StringUtils.hasText(version) || !VERSION_PATTERN.matcher(version).matches()) {
            String msg = "Unsupported Volcengine API version: " + version;
            log.error(msg);
            throw new com.glancy.backend.exception.TtsFailedException(msg);
        }

        String voice = StringUtils.hasText(request.getVoice()) ? request.getVoice() : props.getVoiceType();
        VolcengineTtsPayload payload = VolcengineTtsPayload.builder()
            .appId(props.getAppId())
            .voiceType(voice)
            .text(request.getText())
            .lang(request.getLang())
            .format(request.getFormat())
            .speed(request.getSpeed())
            .build();

        logPayload(payload);

        String url = UriComponentsBuilder.fromHttpUrl(props.getApiUrl())
            .queryParam("Action", props.getAction())
            .queryParam("Version", version)
            .toUriString();
        log.debug("Invoking Volcengine TTS url={} action={} version={}", url, props.getAction(), version);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String bodyJson;
        try {
            bodyJson = new ObjectMapper().writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize TTS payload", e);
        }
        HttpEntity<String> entity = new HttpEntity<>(bodyJson, headers);
        try {
            ResponseEntity<TtsResponse> resp = restTemplate.postForEntity(url, entity, TtsResponse.class);
            TtsResponse body = resp.getBody();

            if (!resp.getStatusCode().is2xxSuccessful() || body == null || body.getData() == null) {
                log.warn(
                    "Volcengine TTS returned unexpected response: status={}, bodyNull={}, dataNull={}",
                    resp.getStatusCode(),
                    body == null,
                    body != null && body.getData() == null
                );
                throw new IllegalStateException(
                    "Upstream TTS (Text-To-Speech) returned empty body or non-2xx status: " + resp.getStatusCode()
                );
            }

            log.debug(
                "Received response from {} status={} durationMs={}",
                url,
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
                    if (body.contains("InvalidCredential")) {
                        log.warn("Volcengine credential rejected");
                    }
                }
            } else if (StringUtils.hasText(ex.getMessage())) {
                msg += " msg=" + ex.getMessage();
            }
            log.error("HTTP (HyperText Transfer Protocol) request to {} failed: {}", url, msg, ex);
            throw new com.glancy.backend.exception.TtsFailedException(msg);
        }
    }

    private void logPayload(VolcengineTtsPayload payload) {
        List<String> missing = new ArrayList<>();
        Map<String, Object> sanitized = new LinkedHashMap<>();

        Object sanitizedAppId = sanitize("appid", payload.getAppId());
        if (!StringUtils.hasText(payload.getAppId())) {
            missing.add("appid");
        }
        sanitized.put("appid", sanitizedAppId);

        Object sanitizedVoice = sanitize("voice_type", payload.getVoiceType());
        if (!StringUtils.hasText(payload.getVoiceType())) {
            missing.add("voice_type");
        }
        sanitized.put("voice_type", sanitizedVoice);

        if (!StringUtils.hasText(payload.getText())) {
            missing.add("text");
        }
        sanitized.put("text", sanitize("text", payload.getText()));

        if (!StringUtils.hasText(payload.getLang())) {
            missing.add("lang");
        }
        sanitized.put("lang", sanitize("lang", payload.getLang()));

        sanitized.put("format", sanitize("format", payload.getFormat()));
        sanitized.put("speed", sanitize("speed", payload.getSpeed()));
        sanitized.put("action", sanitize("action", props.getAction()));
        if (!StringUtils.hasText(props.getVersion())) {
            missing.add("version");
        }
        sanitized.put("version", sanitize("version", props.getVersion()));

        log.info("Resolved TTS parameters appid={}, voice_type={}", sanitizedAppId, sanitizedVoice);

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
