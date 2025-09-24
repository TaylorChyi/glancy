package com.glancy.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.UserPreference;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.llm.stream.CompletionSentinel;
import com.glancy.backend.llm.stream.CompletionSentinel.CompletionCheck;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.util.SensitiveDataUtil;
import java.time.Duration;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;

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
    private final WordPersonalizationService wordPersonalizationService;

    public WordService(
        WordSearcher wordSearcher,
        WordRepository wordRepository,
        UserPreferenceRepository userPreferenceRepository,
        SearchRecordService searchRecordService,
        SearchResultService searchResultService,
        WordResponseParser parser,
        WordPersonalizationService wordPersonalizationService
    ) {
        this.wordSearcher = wordSearcher;
        this.wordRepository = wordRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.searchRecordService = searchRecordService;
        this.searchResultService = searchResultService;
        this.parser = parser;
        this.wordPersonalizationService = wordPersonalizationService;
    }

    private WordResponse fetchAndPersistWord(
        Long userId,
        String term,
        Language language,
        String model,
        SearchRecordResponse record
    ) {
        log.info("Word '{}' not found locally or forceNew requested, searching via LLM", term);
        WordResponse resp = wordSearcher.search(term, language, model);
        log.info("LLM search result: {}", resp);
        Word savedWord = saveWord(term, resp, language);
        String content = resp.getMarkdown();
        if (content == null) {
            try {
                content = serialize(savedWord);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize word '{}' for version content", savedWord.getTerm(), e);
                content = SensitiveDataUtil.previewText(savedWord.getMarkdown());
            }
        }
        SearchResultVersion version = persistVersion(record.id(), userId, model, content, savedWord);
        if (version != null) {
            resp.setVersionId(version.getId());
        }
        return applyPersonalization(userId, resp);
    }

    private Mono<StreamPayload> finalizeStreamingSession(StreamingAccumulator session) {
        CompletionCheck completion = session.summarize(SignalType.ON_COMPLETE);
        if (!completion.satisfied()) {
            log.warn(
                "Streaming session for term '{}' completed without sentinel '{}', skipping persistence",
                session.term(),
                CompletionSentinel.MARKER
            );
            return Mono.empty();
        }
        try {
            ParsedWord parsed = parser.parse(completion.sanitizedContent(), session.term(), session.language());
            WordResponse response = applyPersonalization(session.userId(), parsed.parsed());
            Word savedWord = saveWord(session.term(), response, session.language());
            SearchResultVersion version = persistVersion(
                session.recordId(),
                session.userId(),
                session.model(),
                parsed.markdown(),
                savedWord
            );
            if (version == null) {
                return Mono.empty();
            }
            return Mono.just(StreamPayload.version(String.valueOf(version.getId())));
        } catch (Exception e) {
            log.error("Failed to persist streamed word '{}'", session.term(), e);
            return Mono.empty();
        }
    }

    private SearchResultVersion persistVersion(Long recordId, Long userId, String model, String content, Word word) {
        if (recordId == null) {
            log.warn("Skipping version persistence because search record is unavailable");
            return null;
        }
        return searchResultService.createVersion(
            recordId,
            userId,
            word.getTerm(),
            word.getLanguage(),
            model,
            content,
            word
        );
    }

    public record StreamPayload(String event, String data) {
        public static StreamPayload data(String data) {
            return new StreamPayload(null, data);
        }

        public static StreamPayload version(String versionId) {
            return new StreamPayload("version", versionId);
        }
    }

    @Transactional
    public WordResponse findWordForUser(Long userId, String term, Language language, String model, boolean forceNew) {
        log.info("Finding word '{}' for user {} in language {} using model {}", term, userId, language, model);
        userPreferenceRepository
            .findByUserId(userId)
            .orElseGet(() -> {
                log.info("No user preference found for user {}, using default", userId);
                UserPreference p = new UserPreference();
                p.setDictionaryModel(DictionaryModel.DOUBAO);
                return p;
            });
        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm(term);
        req.setLanguage(language);
        SearchRecordResponse record = searchRecordService.saveRecord(userId, req);
        if (!forceNew) {
            return wordRepository
                .findByTermAndLanguageAndDeletedFalse(term, language)
                .map(word -> {
                    log.info("Found word '{}' in local repository", term);
                    return applyPersonalization(userId, toResponse(word));
                })
                .orElseGet(() -> fetchAndPersistWord(userId, term, language, model, record));
        }
        return fetchAndPersistWord(userId, term, language, model, record);
    }

    /**
     * Stream search results for a word and persist the search record.
     */
    @Transactional
    public Flux<StreamPayload> streamWordForUser(
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
        SearchRecordResponse record;
        try {
            record = searchRecordService.saveRecord(userId, req);
        } catch (Exception e) {
            log.error("Failed to save search record for user {}", userId, e);
            String msg = "Failed to save search record: " + e.getMessage();
            return Flux.error(new IllegalStateException(msg, e));
        }

        if (!forceNew) {
            var existing = wordRepository.findByTermAndLanguageAndDeletedFalse(term, language);
            if (existing.isPresent()) {
                log.info("Found cached word '{}' in language {}", term, language);
                try {
                    WordResponse cached = applyPersonalization(userId, toResponse(existing.get()));
                    return Flux.just(StreamPayload.data(serializeResponse(cached)));
                } catch (Exception e) {
                    log.error("Failed to serialize cached word '{}'", term, e);
                    return Flux.error(new IllegalStateException("Failed to serialize cached word", e));
                }
            }
        }

        StreamingAccumulator session = new StreamingAccumulator(userId, record.id(), term, language, model);
        Flux<String> stream;
        try {
            stream = wordSearcher.streamSearch(term, language, model);
        } catch (Exception e) {
            log.error("Error initiating streaming search for term '{}': {}", term, e.getMessage(), e);
            String msg = "Failed to initiate streaming search: " + e.getMessage();
            return Flux.error(new IllegalStateException(msg, e));
        }

        Flux<StreamPayload> main = stream
            .doOnNext(chunk -> {
                log.info("Streaming chunk for term '{}': {}", term, chunk);
                session.append(chunk);
            })
            .doOnError(err ->
                log.error(
                    "Streaming error for user {} term '{}' in language {} using model {}: {}",
                    userId,
                    term,
                    language,
                    model,
                    err.getMessage(),
                    err
                )
            )
            .doOnError(session::markError)
            .map(StreamPayload::data);

        return main.concatWith(Mono.defer(() -> finalizeStreamingSession(session))).doFinally(session::logSummary);
    }

    private static final class StreamingAccumulator {

        private final Long userId;
        private final Long recordId;
        private final String term;
        private final Language language;
        private final String model;
        private final Instant startedAt = Instant.now();
        private final StringBuilder transcript = new StringBuilder();
        private int chunkCount;
        private boolean error;
        private Throwable failure;
        private String snapshot;

        StreamingAccumulator(Long userId, Long recordId, String term, Language language, String model) {
            this.userId = userId;
            this.recordId = recordId;
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

        CompletionCheck summarize(SignalType signal) {
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

        void logSummary(SignalType signal) {
            if (signal != SignalType.ON_COMPLETE) {
                summarize(signal);
            }
        }

        String aggregatedContent() {
            if (snapshot == null) {
                snapshot = transcript.toString();
            }
            return snapshot;
        }

        Long recordId() {
            return recordId;
        }

        Long userId() {
            return userId;
        }

        String term() {
            return term;
        }

        Language language() {
            return language;
        }

        String model() {
            return model;
        }
    }

    private String serialize(Word word) throws JsonProcessingException {
        return serializeResponse(toResponse(word));
    }

    private String serializeResponse(WordResponse response) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(response);
    }

    private Word saveWord(String requestedTerm, WordResponse resp, Language language) {
        String term = resp.getTerm() != null ? resp.getTerm() : requestedTerm;
        Language lang = resp.getLanguage() != null ? resp.getLanguage() : language;
        Word word = wordRepository.findByTermAndLanguageAndDeletedFalse(term, lang).orElseGet(Word::new);
        word.setTerm(term);
        word.setLanguage(lang);
        word.setMarkdown(resp.getMarkdown());
        word.setDefinitions(resp.getDefinitions());
        word.setVariations(resp.getVariations());
        word.setSynonyms(resp.getSynonyms());
        word.setAntonyms(resp.getAntonyms());
        word.setRelated(resp.getRelated());
        word.setPhrases(resp.getPhrases());
        word.setExample(resp.getExample());
        word.setPhonetic(resp.getPhonetic());
        log.info("Persisting word '{}' with language {}", term, lang);
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
            null,
            null
        );
    }

    private WordResponse applyPersonalization(Long userId, WordResponse response) {
        if (response == null) {
            return null;
        }
        try {
            response.setPersonalization(wordPersonalizationService.personalize(userId, response));
        } catch (Exception ex) {
            log.warn(
                "Failed to personalize response for user {} term '{}': {}",
                userId,
                response.getTerm(),
                SensitiveDataUtil.previewText(ex.getMessage())
            );
        }
        return response;
    }
}
