package com.glancy.backend.client;

import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
class DoubaoOfflineResponseBuilder {

    private static final Pattern TERM_PATTERN = Pattern.compile("\\\"term\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"");
    private static final Pattern TERM_LINE_PATTERN = Pattern.compile(
        "term\\s*[:：]\\s*([^\\n]+)",
        Pattern.CASE_INSENSITIVE
    );

    String build(List<ChatMessage> messages) {
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
}
