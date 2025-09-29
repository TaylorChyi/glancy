package com.glancy.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.WordLookupCoordinator.WordLookupRequest;
import com.glancy.backend.service.WordLookupCoordinator.WordLookupSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

/**
 * Performs dictionary lookups via the configured third-party client.
 */
@Slf4j
@Service
public class WordService {

    private static final String DEFAULT_MODEL = DictionaryModel.DOUBAO.getClientName();

    private final WordLookupCoordinator lookupCoordinator;
    private final WordStreamingHandler streamingHandler;

    public WordService(WordLookupCoordinator lookupCoordinator, WordStreamingHandler streamingHandler) {
        this.lookupCoordinator = lookupCoordinator;
        this.streamingHandler = streamingHandler;
    }

    @Transactional
    public WordResponse findWordForUser(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor,
        String model,
        boolean forceNew
    ) {
        String resolvedModel = resolveModelName(model);
        log.info(
            "Finding word '{}' for user {} in language {} flavor {} using model {}",
            term,
            userId,
            language,
            flavor,
            resolvedModel
        );
        WordLookupSession session = lookupCoordinator.openSession(
            new WordLookupRequest(userId, term, language, flavor, resolvedModel)
        );
        if (!forceNew) {
            return lookupCoordinator
                .findCachedWord(session)
                .map(cached -> {
                    log.info("Found word '{}' in local repository", term);
                    return cached;
                })
                .orElseGet(() -> lookupCoordinator.executeLookup(session));
        }
        return lookupCoordinator.executeLookup(session);
    }

    /**
     * Stream search results for a word and persist the search record.
     */
    @Transactional
    public Flux<StreamPayload> streamWordForUser(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor,
        String model,
        boolean forceNew
    ) {
        String resolvedModel = resolveModelName(model);
        log.info(
            "Streaming word '{}' for user {} in language {} flavor {} using model {}",
            term,
            userId,
            language,
            flavor,
            resolvedModel
        );
        WordLookupSession session;
        try {
            session = lookupCoordinator.openSession(
                new WordLookupRequest(userId, term, language, flavor, resolvedModel)
            );
        } catch (Exception e) {
            log.error("Failed to save search record for user {}", userId, e);
            String msg = "Failed to save search record: " + e.getMessage();
            return Flux.error(new IllegalStateException(msg, e));
        }
        if (!forceNew) {
            return lookupCoordinator
                .findCachedWord(session)
                .map(cached -> {
                    log.info("Found cached word '{}' in language {}", term, language);
                    try {
                        return Flux.just(StreamPayload.data(lookupCoordinator.serializeResponse(cached)));
                    } catch (JsonProcessingException e) {
                        log.error("Failed to serialize cached word '{}'", term, e);
                        return Flux.<StreamPayload>error(
                            new IllegalStateException("Failed to serialize cached word", e)
                        );
                    }
                })
                .orElseGet(() -> streamingHandler.stream(session));
        }
        return streamingHandler.stream(session);
    }

    private String resolveModelName(String requestedModel) {
        if (requestedModel != null) {
            String trimmed = requestedModel.trim();
            if (!trimmed.isEmpty()) {
                if (
                    trimmed.equalsIgnoreCase(DictionaryModel.DOUBAO.name()) || trimmed.equalsIgnoreCase(DEFAULT_MODEL)
                ) {
                    return DEFAULT_MODEL;
                }
                log.warn("Unsupported dictionary model '{}' requested, defaulting to {}", trimmed, DEFAULT_MODEL);
            }
        }
        return DEFAULT_MODEL;
    }
}
