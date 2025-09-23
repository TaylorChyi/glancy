package com.glancy.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.UserPreference;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.llm.stream.CompletionSentinel;
import com.glancy.backend.llm.stream.CompletionSentinel.CompletionCheck;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.SearchResultService;
import com.glancy.backend.util.SensitiveDataUtil;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;
import reactor.core.publisher.Sinks;

/**
 * Performs dictionary lookups via the configured third-party client.
 */
@Slf4j
@Service
public class WordService {

    private final WordSearcher wordSearcher;
    private final WordRepository wordRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final SearchRecordService searchRecordService;
    private final SearchResultService searchResultService;
    private final WordResponseParser parser;
    private final ObjectMapper objectMapper;

    public WordService(
        WordSearcher wordSearcher,
        WordRepository wordRepository,
        UserPreferenceRepository userPreferenceRepository,
        SearchRecordService searchRecordService,
        SearchResultService searchResultService,
        WordResponseParser parser
    ) {
        this.wordSearcher = wordSearcher;
        this.wordRepository = wordRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.searchRecordService = searchRecordService;
        this.searchResultService = searchResultService;
        this.parser = parser;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public WordResponse findWordForUser(
        Long userId,
        Long searchRecordId,
        String term,
        Language language,
        String model,
        boolean forceNew
    ) {
        log.info("Finding word '{}' for user {} in language {} using model {}", term, userId, language, model);
        DictionaryModel preferredModel = userPreferenceRepository
            .findByUserId(userId)
            .map(UserPreference::getDictionaryModel)
            .orElse(DictionaryModel.DOUBAO);
        String resolvedModel = model != null ? model : preferredModel.name();

        Optional<Word> cached = Optional.empty();
        if (!forceNew) {
            cached = wordRepository.findByTermAndLanguageAndDeletedFalse(term, language);
        }

        Word wordEntity;
        WordResponse response;
        String serialized;
        if (cached.isPresent()) {
            wordEntity = cached.get();
            response = toResponse(wordEntity);
            serialized = serializeResponse(response);
            log.info("Found word '{}' in local repository", term);
        } else {
            log.info("Word '{}' not found locally or forceNew triggered, searching via LLM", term);
            WordResponse remote = wordSearcher.search(term, language, model);
            log.info("LLM search result: {}", remote);
            wordEntity = saveWord(term, remote, language);
            response = remote;
            serialized = serializeResponse(response);
        }
        SearchResultService.VersionCommand command = new SearchResultService.VersionCommand(
            userId,
            searchRecordId,
            wordEntity.getId(),
            wordEntity.getTerm(),
            wordEntity.getLanguage(),
            resolvedModel,
            serialized
        );
        long versionId = searchResultService.recordVersion(command).getId();
        response.setVersionId(versionId);
        return response;
    }

    /**
     * Stream search results for a word and persist the search record.
     */
    @Transactional
    public WordStreamResult streamWordForUser(
        Long userId,
        String term,
        Language language,
        String model,
        boolean forceNew
    ) {
        log.info("Streaming word '{}' for user {} in language {} using model {}", term, userId, language, model);
        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm(term);
        req.setLanguage(language);
        Long searchRecordId;
        try {
            searchRecordId = searchRecordService.saveRecord(userId, req).id();
        } catch (Exception e) {
            log.error("Failed to save search record for user {}", userId, e);
            String msg = "Failed to save search record: " + e.getMessage();
            IllegalStateException wrapped = new IllegalStateException(msg, e);
            return new WordStreamResult(Flux.error(wrapped), Mono.error(wrapped));
        }

        DictionaryModel preferredModel = userPreferenceRepository
            .findByUserId(userId)
            .map(UserPreference::getDictionaryModel)
            .orElse(DictionaryModel.DOUBAO);
        String resolvedModel = model != null ? model : preferredModel.name();

        if (!forceNew) {
            Optional<Word> existing = wordRepository.findByTermAndLanguageAndDeletedFalse(term, language);
            if (existing.isPresent()) {
                Word word = existing.get();
                WordResponse cachedResponse = toResponse(word);
                String serialized = serializeResponse(cachedResponse);
                long versionId = searchResultService
                    .recordVersion(
                        new SearchResultService.VersionCommand(
                            userId,
                            searchRecordId,
                            word.getId(),
                            word.getTerm(),
                            word.getLanguage(),
                            resolvedModel,
                            serialized
                        )
                    )
                    .getId();
                return new WordStreamResult(Flux.just(serialized), Mono.just(versionId));
            }
        }

        Sinks.One<Long> versionSink = Sinks.one();
        StreamingAccumulator session = new StreamingAccumulator(userId, term, language, resolvedModel);
        Flux<String> stream;
        try {
            stream = wordSearcher.streamSearch(term, language, model);
        } catch (Exception e) {
            log.error("Error initiating streaming search for term '{}': {}", term, e.getMessage(), e);
            String msg = "Failed to initiate streaming search: " + e.getMessage();
            IllegalStateException wrapped = new IllegalStateException(msg, e);
            versionSink.tryEmitError(wrapped);
            return new WordStreamResult(Flux.error(wrapped), versionSink.asMono());
        }

        Flux<String> payload = stream
            .doOnNext(chunk -> {
                log.info("Streaming chunk for term '{}': {}", term, chunk);
                session.append(chunk);
            })
            .doOnError(err -> {
                log.error(
                    "Streaming error for user {} term '{}' in language {} using model {}: {}",
                    userId,
                    term,
                    language,
                    model,
                    err.getMessage(),
                    err
                );
                session.markError(err);
                versionSink.tryEmitError(err);
            })
            .doFinally(signal -> {
                log.info("Streaming finished for term '{}' with signal {}", term, signal);
                CompletionCheck completion = session.finish(signal);
                if (signal != SignalType.ON_COMPLETE) {
                    if (!session.hasError()) {
                        versionSink.tryEmitEmpty();
                    }
                    return;
                }
                if (!completion.satisfied()) {
                    log.warn(
                        "Streaming session for term '{}' completed without sentinel '{}', skipping persistence",
                        term,
                        CompletionSentinel.MARKER
                    );
                    versionSink.tryEmitEmpty();
                    return;
                }
                try {
                    ParsedWord parsed = parser.parse(completion.sanitizedContent(), term, language);
                    Word saved = saveWord(term, parsed.parsed(), language);
                    long versionId = searchResultService
                        .recordVersion(
                            new SearchResultService.VersionCommand(
                                userId,
                                searchRecordId,
                                saved.getId(),
                                saved.getTerm(),
                                saved.getLanguage(),
                                resolvedModel,
                                completion.sanitizedContent()
                            )
                        )
                        .getId();
                    versionSink.tryEmitValue(versionId);
                } catch (Exception e) {
                    log.error("Failed to persist streamed word '{}'", term, e);
                    versionSink.tryEmitError(e);
                }
            });
        return new WordStreamResult(payload, versionSink.asMono());
    }

    private static final class StreamingAccumulator {

        private final Long userId;
        private final String term;
        private final Language language;
        private final String model;
        private final Instant startedAt = Instant.now();
        private final StringBuilder transcript = new StringBuilder();
        private int chunkCount;
        private boolean error;
        private Throwable failure;
        private String snapshot;

        StreamingAccumulator(Long userId, String term, Language language, String model) {
            this.userId = userId;
            this.term = term;
            this.language = language;
            this.model = model;
        }

        void append(String chunk) {
            chunkCount++;
            transcript.append(chunk);
        }

        void markError(Throwable throwable) {
            error = true;
            failure = throwable;
        }

        boolean hasError() {
            return error;
        }

        CompletionCheck finish(SignalType signal) {
            long duration = Duration.between(startedAt, Instant.now()).toMillis();
            String aggregated = aggregatedContent();
            String errorSummary = "<none>";
            if (error) {
                String message = failure != null ? failure.getMessage() : "";
                errorSummary = SensitiveDataUtil.previewText(message);
            }
            CompletionCheck completion = CompletionSentinel.inspect(aggregated);
            log.info(
                "Streaming session summary [user={}, term='{}', language={}, model={}]: signal={}, " +
                "chunks={}, totalChars={}, durationMs={}, error={}, completionSentinelPresent={}, preview={}",
                userId,
                term,
                language,
                model,
                signal,
                chunkCount,
                aggregated.length(),
                duration,
                errorSummary,
                completion.satisfied(),
                SensitiveDataUtil.previewText(aggregated)
            );
            return completion;
        }

        String aggregatedContent() {
            if (snapshot == null) {
                snapshot = transcript.toString();
            }
            return snapshot;
        }
    }

    private String serializeResponse(WordResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize search result", e);
        }
    }

    private Word saveWord(String requestedTerm, WordResponse resp, Language language) {
        Word word = new Word();
        word.setMarkdown(resp.getMarkdown());
        String term = resp.getTerm() != null ? resp.getTerm() : requestedTerm;
        word.setTerm(term);
        Language lang = resp.getLanguage() != null ? resp.getLanguage() : language;
        word.setLanguage(lang);
        word.setDefinitions(resp.getDefinitions());
        word.setVariations(resp.getVariations());
        word.setSynonyms(resp.getSynonyms());
        word.setAntonyms(resp.getAntonyms());
        word.setRelated(resp.getRelated());
        word.setPhrases(resp.getPhrases());
        word.setExample(resp.getExample());
        word.setPhonetic(resp.getPhonetic());
        log.info("Persisting new word '{}' with language {}", term, lang);
        Word saved = wordRepository.save(word);
        resp.setId(String.valueOf(saved.getId()));
        resp.setLanguage(lang);
        resp.setTerm(term);
        resp.setMarkdown(word.getMarkdown());
        return saved;
    }

    private WordResponse toResponse(Word word) {
        return new WordResponse(
            String.valueOf(word.getId()),
            word.getTerm(),
            word.getDefinitions(),
            word.getLanguage(),
            word.getExample(),
            word.getPhonetic(),
            word.getVariations(),
            word.getSynonyms(),
            word.getAntonyms(),
            word.getRelated(),
            word.getPhrases(),
            word.getMarkdown(),
            null
        );
    }

    public record WordStreamResult(Flux<String> payload, Mono<Long> versionId) {}
}
