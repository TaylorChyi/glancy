package com.glancy.backend.client;

import com.glancy.backend.config.DoubaoProperties;
import com.glancy.backend.dto.ChatCompletionResponse;
import com.glancy.backend.exception.BusinessException;
import com.glancy.backend.exception.UnauthorizedException;
import com.glancy.backend.llm.llm.DictionaryModelClient;
import com.glancy.backend.llm.llm.DictionaryModelRequestFallbacks;
import com.glancy.backend.llm.llm.DictionaryModelRequestOptions;
import com.glancy.backend.llm.model.ChatMessage;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component("doubaoClient")
public class DoubaoClient implements DictionaryModelClient {

    private final WebClient webClient;
    private final String chatPath;
    private final String apiKey;
    private final String model;
    private final Integer maxCompletionTokens;
    private final boolean defaultStream;
    private final String defaultThinkingType;
    private final boolean offlineMode;

    public DoubaoClient(WebClient.Builder builder, DoubaoProperties properties) {
        this.webClient = builder.baseUrl(trimTrailingSlash(properties.getBaseUrl())).build();
        this.chatPath = ensureLeadingSlash(properties.getChatPath());
        this.apiKey = properties.getApiKey() == null ? null : properties.getApiKey().trim();
        this.model = properties.getModel();
        this.maxCompletionTokens = properties.getMaxCompletionTokens();
        this.defaultStream = DictionaryModelRequestFallbacks.resolveStream(properties.getDefaultStream());
        this.defaultThinkingType = DictionaryModelRequestFallbacks.resolveThinkingType(
            properties.getDefaultThinkingType()
        );
        this.offlineMode = apiKey == null || apiKey.isBlank();
        if (offlineMode) {
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
    public String generateEntry(List<ChatMessage> messages, double temperature) {
        return generateEntry(messages, temperature, DictionaryModelRequestOptions.defaults());
    }

    @Override
    public String generateEntry(List<ChatMessage> messages, double temperature, DictionaryModelRequestOptions options) {
        if (offlineMode) {
            return buildOfflineResponse(messages);
        }
        DictionaryModelRequestOptions safeOptions = options == null
            ? DictionaryModelRequestOptions.defaults()
            : options;
        boolean stream = safeOptions.resolveStream(defaultStream);
        String thinkingType = safeOptions.resolveThinkingType(defaultThinkingType);
        log.info(
            "DoubaoClient.generateEntry called with {} messages, temperature={}, stream={}, thinkingType={}",
            messages.size(),
            temperature,
            stream,
            thinkingType
        );
        Map<String, Object> body = prepareRequestBody(messages, temperature, stream, thinkingType);
        try {
            return prepareRequest(body)
                .exchangeToMono(this::handleSyncResponse)
                .map(this::extractAssistantContent)
                .doOnNext(content ->
                    log.info("DoubaoClient.generateEntry aggregated response length={}", content.length())
                )
                .blockOptional()
                .orElse("");
        } catch (UnauthorizedException ex) {
            if (!offlineMode) {
                throw ex;
            }
            log.warn("Doubao API returned unauthorized, falling back to offline response", ex);
            return buildOfflineResponse(messages);
        }
    }

    private Map<String, Object> prepareRequestBody(
        List<ChatMessage> messages,
        double temperature,
        boolean stream,
        String thinkingType
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("temperature", temperature);
        body.put("stream", stream);
        body.put("thinking", Map.of("type", thinkingType));
        if (maxCompletionTokens != null && maxCompletionTokens > 0) {
            body.put("max_completion_tokens", maxCompletionTokens);
        }

        List<Map<String, String>> reqMessages = new ArrayList<>();
        for (ChatMessage m : messages) {
            reqMessages.add(Map.of("role", m.getRole(), "content", m.getContent()));
        }
        List<String> roles = messages.stream().map(ChatMessage::getRole).toList();
        log.info("Prepared {} request messages with roles {}", reqMessages.size(), roles);
        body.put("messages", reqMessages);
        return body;
    }

    private WebClient.RequestHeadersSpec<?> prepareRequest(Map<String, Object> body) {
        return webClient
            .post()
            .uri(chatPath)
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_JSON)
            .headers(h -> {
                if (apiKey != null && !apiKey.isEmpty()) {
                    h.setBearerAuth(apiKey);
                }
            })
            .bodyValue(body);
    }

    private Mono<ChatCompletionResponse> handleSyncResponse(ClientResponse resp) {
        if (resp.statusCode().is4xxClientError()) {
            if (resp.statusCode().value() == 401) {
                return Mono.error(new UnauthorizedException("Invalid Doubao API key"));
            }
            return Mono.error(new BusinessException("Failed to call Doubao API: " + resp.statusCode()));
        }
        if (resp.statusCode().is5xxServerError()) {
            return Mono.error(new BusinessException("Doubao API returned 5xx: " + resp.statusCode()));
        }
        return resp
            .bodyToMono(ChatCompletionResponse.class)
            .doOnNext(body -> log.debug("Doubao sync response payload received: {}", body));
    }

    private String extractAssistantContent(ChatCompletionResponse response) {
        if (response == null || response.getChoices() == null) {
            log.warn("Doubao aggregated response missing choices - returning empty content");
            return "";
        }
        return response
            .getChoices()
            .stream()
            .map(ChatCompletionResponse.Choice::getMessage)
            .filter(Objects::nonNull)
            .map(ChatCompletionResponse.Message::getContent)
            .filter(Objects::nonNull)
            .findFirst()
            .orElse("");
    }

    private String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String ensureLeadingSlash(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        return path.startsWith("/") ? path : "/" + path;
    }

    private String maskKey(String key) {
        if (key.length() <= 8) {
            return "****";
        }
        int end = key.length() - 4;
        return key.substring(0, 4) + "****" + key.substring(end);
    }

    private String buildOfflineResponse(List<ChatMessage> messages) {
        String term = inferTerm(messages);
        String sanitizedTerm = term.replaceAll("[\\r\\n]+", " ").trim();
        if (sanitizedTerm.isEmpty()) {
            sanitizedTerm = "entry";
        }
        String definition = "Offline definition generated locally for '" + sanitizedTerm + "'.";
        String json =
            "{" +
            "\"term\":\"" +
            escapeJson(sanitizedTerm) +
            "\"," +
            "\"language\":\"ENGLISH\"," +
            "\"definitions\":[{\"partOfSpeech\":\"general\",\"meanings\":[\"" +
            escapeJson(definition) +
            "\"]}]" +
            "}";
        log.info("Returning offline Doubao response for term '{}'", sanitizedTerm);
        return json;
    }

    private String inferTerm(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return "";
        }
        for (int i = messages.size() - 1; i >= 0; i--) {
            ChatMessage message = messages.get(i);
            if (!"user".equalsIgnoreCase(message.getRole())) {
                continue;
            }
            String content = message.getContent();
            String candidate = extractTermFromPayload(content);
            if (!candidate.isEmpty()) {
                return candidate;
            }
        }
        return messages.get(messages.size() - 1).getContent();
    }

    private String extractTermFromPayload(String payload) {
        if (payload == null) {
            return "";
        }
        Matcher matcher = TERM_PATTERN.matcher(payload);
        if (matcher.find()) {
            return matcher.group(1);
        }
        matcher = TERM_LINE_PATTERN.matcher(payload);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return payload.trim();
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static final Pattern TERM_PATTERN = Pattern.compile("\\\"term\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"");
    private static final Pattern TERM_LINE_PATTERN = Pattern.compile(
        "term\\s*[:：]\\s*([^\\n]+)",
        Pattern.CASE_INSENSITIVE
    );
}
