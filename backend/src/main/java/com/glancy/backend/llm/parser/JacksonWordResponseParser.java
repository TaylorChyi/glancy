package com.glancy.backend.llm.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JacksonWordResponseParser implements WordResponseParser {

    private final ObjectMapper objectMapper;

    @Override
    public ParsedWord parse(String content, String term, Language language) {
        String markdown = content;
        return tryParseJson(extractJson(content))
                .map(node -> JsonWordPayload.build(node, term, language, markdown))
                .orElseGet(() -> buildFromMarkdown(markdown, term, language));
    }

    private ParsedWord buildFromMarkdown(String markdown, String term, Language language) {
        MarkdownWordSnapshot snapshot = MarkdownWordExtractor.extract(markdown, term);
        WordResponse response = new WordResponse(
                null,
                snapshot.term(),
                snapshot.definitions(),
                language,
                snapshot.example(),
                snapshot.phonetic(),
                snapshot.variations(),
                snapshot.synonyms(),
                snapshot.antonyms(),
                snapshot.related(),
                snapshot.phrases(),
                markdown,
                null,
                null,
                null);
        return new ParsedWord(response, markdown);
    }

    private Optional<JsonNode> tryParseJson(String candidate) {
        if (candidate == null) {
            return Optional.empty();
        }
        String trimmed = candidate.trim();
        if (trimmed.isEmpty() || !looksLikeJsonStructure(trimmed)) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readTree(trimmed));
        } catch (Exception ex) {
            log.debug("Failed to parse JSON content, markdown fallback will be used.", ex);
            return Optional.empty();
        }
    }

    private boolean looksLikeJsonStructure(String text) {
        char first = text.charAt(0);
        char last = text.charAt(text.length() - 1);
        return (first == '{' && last == '}') || (first == '[' && last == ']');
    }

    private String extractJson(String text) {
        if (text == null) {
            return "";
        }
        String trimmed = stripCodeFence(text.trim());
        return trimJsonEnvelope(trimmed).trim();
    }

    private String stripCodeFence(String text) {
        if (!text.startsWith("```")) {
            return text;
        }
        int firstNewline = text.indexOf('\n');
        String withoutFence = firstNewline == -1 ? "" : text.substring(firstNewline + 1);
        int lastFence = withoutFence.lastIndexOf("```");
        if (lastFence == -1) {
            return withoutFence;
        }
        return withoutFence.substring(0, lastFence);
    }

    private String trimJsonEnvelope(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start == -1 || end == -1 || start >= end) {
            return text;
        }
        return text.substring(start, end + 1);
    }
}
