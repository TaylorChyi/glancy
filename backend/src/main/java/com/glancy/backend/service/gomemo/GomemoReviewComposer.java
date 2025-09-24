package com.glancy.backend.service.gomemo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.config.GomemoProperties;
import com.glancy.backend.dto.GomemoProgressDetailView;
import com.glancy.backend.dto.GomemoProgressSnapshotView;
import com.glancy.backend.entity.GomemoProgress;
import com.glancy.backend.gomemo.model.GomemoPersona;
import com.glancy.backend.gomemo.model.GomemoPlanWord;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import com.glancy.backend.llm.prompt.PromptManager;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

/**
 * Orchestrates Doubao powered reviews for completed sessions.
 */
@Component
public class GomemoReviewComposer {

    private final LLMClientFactory clientFactory;
    private final GomemoProperties properties;
    private final PromptManager promptManager;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GomemoReviewComposer(LLMClientFactory clientFactory, GomemoProperties properties, PromptManager promptManager) {
        this.clientFactory = clientFactory;
        this.properties = properties;
        this.promptManager = promptManager;
    }

    public ReviewResult compose(
        GomemoPersona persona,
        List<GomemoPlanWord> plan,
        GomemoProgressSnapshotView snapshot,
        List<GomemoProgress> entries
    ) {
        GomemoProperties.Review reviewCfg = properties.getReview();
        LLMClient client = clientFactory.get(reviewCfg.getClient());
        if (client == null) {
            throw new IllegalStateException("LLM client not configured for Gomemo review");
        }
        String prompt = promptManager.loadPrompt(reviewCfg.getPromptPath());
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(new ChatMessage("system", prompt));
        messages.add(new ChatMessage("user", buildPayload(persona, plan, snapshot, entries)));
        String response = client.chat(messages, reviewCfg.getTemperature());
        return parseResponse(response);
    }

    private ReviewResult parseResponse(String response) {
        try {
            JsonNode node = objectMapper.readTree(response);
            String review = node.path("review").asText("");
            String nextFocus = node.path("next_focus").asText("");
            return new ReviewResult(review, nextFocus);
        } catch (Exception ex) {
            return new ReviewResult(response, "");
        }
    }

    private String buildPayload(
        GomemoPersona persona,
        List<GomemoPlanWord> plan,
        GomemoProgressSnapshotView snapshot,
        List<GomemoProgress> entries
    ) {
        StringBuilder builder = new StringBuilder();
        builder
            .append("Persona: ")
            .append(persona.descriptor())
            .append(" | tone=")
            .append(persona.tone())
            .append(" | goal=")
            .append(nullToPlaceholder(persona.goal()))
            .append(" | future=")
            .append(nullToPlaceholder(persona.futurePlan()))
            .append(" | interests=")
            .append(String.join(",", persona.interests()));
        builder
            .append("\nDaily target: ")
            .append(persona.dailyTarget())
            .append(", completed=")
            .append(snapshot.completedWords())
            .append("/" + snapshot.totalWords());
        builder
            .append("\nPlan words: ")
            .append(plan
                .stream()
                .map(word -> word.term() + "(" + word.priorityScore() + ")")
                .collect(Collectors.joining(", ")));
        if (!CollectionUtils.isEmpty(snapshot.details())) {
            builder.append("\nProgress: ");
            for (GomemoProgressDetailView detail : snapshot.details()) {
                builder
                    .append(detail.term())
                    .append("|")
                    .append(detail.mode())
                    .append("|")
                    .append(String.format(Locale.ROOT, "%.1f", detail.retentionScore()))
                    .append("; ");
            }
        }
        if (!CollectionUtils.isEmpty(entries)) {
            builder.append("\nRaw attempts: ");
            for (GomemoProgress entry : entries) {
                builder
                    .append(entry.getTerm())
                    .append("-" + entry.getMode())
                    .append(" attempts=")
                    .append(entry.getAttempts())
                    .append(" successes=")
                    .append(entry.getSuccesses())
                    .append(" score=")
                    .append(entry.getRetentionScore())
                    .append(" | ");
            }
        }
        return builder.toString();
    }

    private String nullToPlaceholder(String value) {
        return StringUtils.hasText(value) ? value : "N/A";
    }

    public record ReviewResult(String review, String nextFocus) {}
}
