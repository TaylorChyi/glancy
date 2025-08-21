package com.glancy.backend.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.ChatCompletionResponse;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.parser.WordResponseParser;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;

@Slf4j
@Component("deepSeekClient")
public class DeepSeekClient implements DictionaryClient, LLMClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;
    private final String enToZhPrompt;
    private final String zhToEnPrompt;
    private final WordResponseParser parser;

    public DeepSeekClient(
        RestTemplate restTemplate,
        @Value("${thirdparty.deepseek.base-url:https://api.deepseek.com}") String baseUrl,
        @Value("${thirdparty.deepseek.api-key:}") String apiKey,
        WordResponseParser parser
    ) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.parser = parser;
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("DeepSeek API key is empty");
        } else {
            log.info("DeepSeek API key loaded: {}", maskKey(apiKey));
        }
        this.enToZhPrompt = loadPrompt("prompts/english_to_chinese.txt");
        this.zhToEnPrompt = loadPrompt("prompts/chinese_to_english.txt");
    }

    @Override
    public String name() {
        return "deepseek";
    }

    @Override
    public Flux<String> streamChat(List<ChatMessage> messages, double temperature) {
        return Flux.just(chat(messages, temperature));
    }

    private String loadPrompt(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            return StreamUtils.copyToString(resource.getInputStream(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Failed to load prompt {}", path, e);
            return "";
        }
    }

    @Override
    public String chat(List<ChatMessage> messages, double temperature) {
        log.info("DeepSeekClient.chat called with {} messages, temperature={}", messages.size(), temperature);

        String url = UriComponentsBuilder.fromUriString(baseUrl).path("/v1/chat/completions").toUriString();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (apiKey != null && !apiKey.isEmpty()) {
            headers.setBearerAuth(apiKey);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", "deepseek-chat");
        body.put("temperature", temperature);
        body.put("stream", false);

        List<Map<String, String>> messageList = new ArrayList<>();
        for (ChatMessage m : messages) {
            messageList.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }
        log.info("Prepared {} request messages: roles={}", messageList.size(), messages.stream().map(ChatMessage::getRole).toList());
        body.put("messages", messageList);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            log.info("Sending request to DeepSeek API: url={}, body={}", url, body);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            log.info("DeepSeek API responded with status: {}", response.getStatusCode());
            log.info("DeepSeek API raw response body: {}", response.getBody());
            ObjectMapper mapper = new ObjectMapper();
            ChatCompletionResponse chat = mapper.readValue(response.getBody(), ChatCompletionResponse.class);
            return chat.getChoices().get(0).getMessage().getContent();
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized ex) {
            log.error("DeepSeek API unauthorized", ex);
            throw new com.glancy.backend.exception.UnauthorizedException("Invalid DeepSeek API key");
        } catch (org.springframework.web.client.HttpClientErrorException ex) {
            log.error("DeepSeek API error: {}", ex.getStatusCode());
            throw new com.glancy.backend.exception.BusinessException(
                "Failed to call DeepSeek API: " + ex.getStatusCode(),
                ex
            );
        } catch (Exception e) {
            log.warn("Failed to parse DeepSeek response", e);
            return "";
        }
    }

    @Override
    public WordResponse fetchDefinition(String term, Language language) {
        log.info("Entering fetchDefinition with term '{}' and language {}", term, language);
        String systemPrompt = language == Language.ENGLISH ? enToZhPrompt : zhToEnPrompt;
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", systemPrompt));
        messages.add(new ChatMessage("user", term));
        String content = chat(messages, 0.7);
        log.info("DeepSeek response content: {}", content);
        WordResponse response = parser.parse(content, term, language);
        log.info("Parsed word response: {}", response);
        return response;
    }

    @Override
    public byte[] fetchAudio(String term, Language language) {
        String url = UriComponentsBuilder.fromUriString(baseUrl)
            .path("/words/audio")
            .queryParam("term", term)
            .queryParam("language", language.name().toLowerCase())
            .toUriString();
        HttpHeaders headers = new HttpHeaders();
        if (apiKey != null && !apiKey.isEmpty()) {
            headers.setBearerAuth(apiKey);
        }
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
        ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, byte[].class);
        return response.getBody();
    }

    private String maskKey(String key) {
        if (key.length() <= 8) {
            return "****";
        }
        int end = key.length() - 4;
        return key.substring(0, 4) + "****" + key.substring(end);
    }
}
