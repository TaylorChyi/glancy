package com.glancy.backend.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.dto.ChatCompletionResponse;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.util.UrlUtils;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Client for Doubao LLM using simple HTTP calls.
 */
@Slf4j
@Component("doubaoClient")
public class DoubaoClient implements LLMClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String chatPath;
    private final String apiKey;
    private final String model;

    public DoubaoClient(RestTemplate restTemplate, DoubaoProperties properties) {
        this.restTemplate = restTemplate;
        this.baseUrl = UrlUtils.trimTrailingSlash(properties.getBaseUrl());
        this.chatPath = UrlUtils.ensureLeadingSlash(properties.getChatPath());
        this.apiKey = properties.getApiKey() == null ? null : properties.getApiKey().trim();
        this.model = properties.getModel();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Doubao API key is empty");
        } else {
            log.info("Doubao API key loaded: {}", maskKey(apiKey));
        }
    }

    @Override
    public String name() {
        return "doubao";
    }

    @Override
    public String chat(List<ChatMessage> messages, double temperature) {
        String url = baseUrl + chatPath;
        log.debug("Doubao request URL: {}", url);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (apiKey != null && !apiKey.isEmpty()) {
            headers.setBearerAuth(apiKey);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("temperature", temperature);
        body.put("stream", false);

        List<Map<String, String>> reqMessages = new ArrayList<>();
        for (ChatMessage m : messages) {
            reqMessages.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }
        body.put("messages", reqMessages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            ObjectMapper mapper = new ObjectMapper();
            ChatCompletionResponse resp = mapper.readValue(response.getBody(), ChatCompletionResponse.class);
            return resp.getChoices().get(0).getMessage().getContent();
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized ex) {
            log.error("Doubao API unauthorized", ex);
            throw new com.glancy.backend.exception.UnauthorizedException("Invalid Doubao API key");
        } catch (org.springframework.web.client.HttpClientErrorException ex) {
            log.error("Doubao API error: {}", ex.getStatusCode());
            throw new com.glancy.backend.exception.BusinessException(
                "Failed to call Doubao API: " + ex.getStatusCode(),
                ex
            );
        } catch (Exception e) {
            log.warn("Failed to parse Doubao response", e);
            return "";
        }
    }

    private String maskKey(String key) {
        if (key.length() <= 8) {
            return "****";
        }
        int end = key.length() - 4;
        return key.substring(0, 4) + "****" + key.substring(end);
    }
}
