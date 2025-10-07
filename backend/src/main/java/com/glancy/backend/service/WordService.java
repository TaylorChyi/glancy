package com.glancy.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.exception.BusinessException;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.llm.stream.CompletionSentinel;
import com.glancy.backend.llm.stream.CompletionSentinel.CompletionCheck;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
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

/**
 * Performs dictionary lookups via the configured third-party client.
 */
@Slf4j
@Service
public class WordService {

    private final WordSearcher wordSearcher;
    private final WordRepository wordRepository;
    private final SearchRecordService searchRecordService;
    private final SearchResultService searchResultService;
    private final WordResponseParser parser;
    private final WordPersonalizationService wordPersonalizationService;
    private final DictionaryTermNormalizer termNormalizer;
    private final ObjectMapper objectMapper;

    public WordService(
        WordSearcher wordSearcher,
        WordRepository wordRepository,
        SearchRecordService searchRecordService,
        SearchResultService searchResultService,
        WordResponseParser parser,
        WordPersonalizationService wordPersonalizationService,
        DictionaryTermNormalizer termNormalizer,
        ObjectMapper objectMapper
    ) {
        this.wordSearcher = wordSearcher;
        this.wordRepository = wordRepository;
        this.searchRecordService = searchRecordService;
        this.searchResultService = searchResultService;
        this.parser = parser;
        this.wordPersonalizationService = wordPersonalizationService;
        this.termNormalizer = termNormalizer;
        this.objectMapper = objectMapper;
    }

    private static final String DEFAULT_MODEL = DictionaryModel.DOUBAO.getClientName();

    private WordResponse fetchAndPersistWord(
        Long userId,
        String rawTerm,
        String normalizedTerm,
        Language language,
        DictionaryFlavor flavor,
        String model,
        SearchRecordResponse record,
        boolean captureHistory,
        WordPersonalizationContext personalizationContext
    ) {
        log.info(
            "Word '{}' (normalized '{}') not found locally or forceNew requested, searching via LLM model {}",
            rawTerm,
            normalizedTerm,
            model
        );
        WordResponse resp = wordSearcher.search(rawTerm, language, flavor, model, personalizationContext);
        resp.setFlavor(flavor);
        log.info("LLM search result: {}", resp);
        Word savedWord = saveWord(rawTerm, resp, language, flavor);
        if (captureHistory) {
            synchronizeRecordTermQuietly(userId, record, savedWord.getTerm());
            String content = resp.getMarkdown();
            if (content == null) {
                try {
                    content = serialize(savedWord);
                } catch (JsonProcessingException e) {
                    log.warn("Failed to serialize word '{}' for version content", savedWord.getTerm(), e);
                    content = SensitiveDataUtil.previewText(savedWord.getMarkdown());
                }
            }
            Long recordId = record != null ? record.id() : null;
            SearchResultVersion version = persistVersion(recordId, userId, model, content, savedWord, flavor);
            if (version != null) {
                resp.setVersionId(version.getId());
            }
        }
        return applyPersonalization(userId, resp, personalizationContext);
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
            WordResponse response = applyPersonalization(
                session.userId(),
                parsed.parsed(),
                session.personalizationContext()
            );
            response.setFlavor(session.flavor());
            Word savedWord = saveWord(session.term(), response, session.language(), session.flavor());
            if (!session.captureHistory()) {
                log.info(
                    "History capture disabled for streaming session user {} term '{}' - skipping record persistence",
                    session.userId(),
                    session.term()
                );
                return Mono.empty();
            }
            synchronizeRecordTermQuietly(session.userId(), session.recordId(), savedWord.getTerm());
            SearchResultVersion version = persistVersion(
                session.recordId(),
                session.userId(),
                session.model(),
                parsed.markdown(),
                savedWord,
                session.flavor()
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

    private SearchResultVersion persistVersion(
        Long recordId,
        Long userId,
        String model,
        String content,
        Word word,
        DictionaryFlavor flavor
    ) {
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
            word,
            flavor
        );
    }

    /**
     * 意图：在词条被模型纠正后同步更新对应的搜索记录，避免历史记录出现旧词条。\
     * 输入：\
     *  - userId：当前用户 ID，用于校验及日志；\
     *  - record：可选的搜索记录响应，当为 null 时说明当前上下文缺失完整响应；\
     *  - canonicalTerm：模型返回的规范词条。\
     * 输出：无返回值，最佳努力地调用 {@link SearchRecordService#synchronizeRecordTerm(Long, Long, String)}。\
     * 流程：优先解析 recordId，若不可用则直接返回；若同步失败则记录警告并继续主流程。\
     * 错误处理：捕获所有异常并写日志，确保不会影响查词主路径。\
     * 复杂度：O(1)。
     */
    private void synchronizeRecordTermQuietly(Long userId, SearchRecordResponse record, String canonicalTerm) {
        Long recordId = record != null ? record.id() : null;
        synchronizeRecordTermQuietly(userId, recordId, canonicalTerm);
    }

    private void synchronizeRecordTermQuietly(Long userId, Long recordId, String canonicalTerm) {
        try {
            searchRecordService.synchronizeRecordTerm(userId, recordId, canonicalTerm);
        } catch (Exception ex) {
            log.warn(
                "Failed to synchronize search record {} for user {} with canonical term '{}': {}",
                recordId,
                userId,
                canonicalTerm,
                ex.getMessage(),
                ex
            );
        }
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
    public WordResponse findWordForUser(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor,
        String model,
        boolean forceNew,
        boolean captureHistory
    ) {
        String resolvedModel = resolveModelName(model);
        String normalizedTerm = termNormalizer.normalize(term);
        log.info(
            "Finding word '{}' (normalized '{}') for user {} in language {} flavor {} using model {}",
            term,
            normalizedTerm,
            userId,
            language,
            flavor,
            resolvedModel
        );
        WordPersonalizationContext personalizationContext = wordPersonalizationService.resolveContext(userId);
        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm(term);
        req.setLanguage(language);
        req.setFlavor(flavor);
        final SearchRecordResponse record = captureHistory ? searchRecordService.saveRecord(userId, req) : null;
        if (!forceNew) {
            return findCachedWord(normalizedTerm, language, flavor)
                .map(word -> {
                    log.info("Found word '{}' in local repository", word.getTerm());
                    WordResponse response = toResponse(word);
                    response.setFlavor(flavor);
                    // 兜底：命中缓存同样需要同步历史记录展示词条，避免大小写差异导致的重复记录。
                    synchronizeRecordTermQuietly(userId, record, word.getTerm());
                    return applyPersonalization(userId, response, personalizationContext);
                })
                .orElseGet(() ->
                    fetchAndPersistWord(
                        userId,
                        term,
                        normalizedTerm,
                        language,
                        flavor,
                        resolvedModel,
                        record,
                        captureHistory,
                        personalizationContext
                    )
                );
        }
        return fetchAndPersistWord(
            userId,
            term,
            normalizedTerm,
            language,
            flavor,
            resolvedModel,
            record,
            captureHistory,
            personalizationContext
        );
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
        boolean forceNew,
        boolean captureHistory
    ) {
        String resolvedModel = resolveModelName(model);
        String normalizedTerm = termNormalizer.normalize(term);
        log.info(
            "Streaming word '{}' (normalized '{}') for user {} in language {} flavor {} using model {}",
            term,
            normalizedTerm,
            userId,
            language,
            flavor,
            resolvedModel
        );
        WordPersonalizationContext personalizationContext = wordPersonalizationService.resolveContext(userId);
        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm(term);
        req.setLanguage(language);
        req.setFlavor(flavor);
        final SearchRecordResponse record;
        if (captureHistory) {
            try {
                record = searchRecordService.saveRecord(userId, req);
            } catch (BusinessException e) {
                return Flux.error(e);
            } catch (Exception e) {
                log.error("Failed to save search record for user {}", userId, e);
                return Flux.error(new IllegalStateException("Failed to save search record", e));
            }
        } else {
            record = null;
        }

        if (!forceNew) {
            Optional<Word> existing = findCachedWord(normalizedTerm, language, flavor);
            if (existing.isPresent()) {
                Word cachedWord = existing.get();
                log.info("Found cached word '{}' in language {}", cachedWord.getTerm(), language);
                // 兜底：流式查询命中缓存时也需纠正历史记录词条，保证记录去重。
                synchronizeRecordTermQuietly(userId, record, cachedWord.getTerm());
                try {
                    WordResponse cached = applyPersonalization(userId, toResponse(cachedWord), personalizationContext);
                    return Flux.just(StreamPayload.data(serializeResponse(cached)));
                } catch (JsonProcessingException e) {
                    log.error("Failed to serialize cached word '{}'", term, e);
                    return Flux.error(new IllegalStateException("Failed to serialize cached word", e));
                }
            }
        }

        StreamingAccumulator session = new StreamingAccumulator(
            userId,
            record != null ? record.id() : null,
            term,
            language,
            flavor,
            resolvedModel,
            personalizationContext,
            captureHistory
        );
        Flux<String> stream;
        try {
            stream = wordSearcher.streamSearch(term, language, flavor, resolvedModel, personalizationContext);
        } catch (BusinessException e) {
            return Flux.error(e);
        } catch (Exception e) {
            log.error("Error initiating streaming search for term '{}'", term, e);
            return Flux.error(
                new IllegalStateException(String.format("Failed to initiate streaming search: %s", e.getMessage()), e)
            );
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
                    resolvedModel,
                    err.getMessage(),
                    err
                )
            )
            .doOnError(session::markError)
            .map(StreamPayload::data);

        return main.concatWith(Mono.defer(() -> finalizeStreamingSession(session))).doFinally(session::logSummary);
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

    private static final class StreamingAccumulator {

        private final Long userId;
        private final Long recordId;
        private final String term;
        private final Language language;
        private final DictionaryFlavor flavor;
        private final String model;
        private final WordPersonalizationContext personalizationContext;
        private final boolean captureHistory;
        private final Instant startedAt = Instant.now();
        private final StringBuilder transcript = new StringBuilder();
        private int chunkCount;
        private boolean error;
        private Throwable failure;
        private String snapshot;

        StreamingAccumulator(
            Long userId,
            Long recordId,
            String term,
            Language language,
            DictionaryFlavor flavor,
            String model,
            WordPersonalizationContext personalizationContext,
            boolean captureHistory
        ) {
            this.userId = userId;
            this.recordId = recordId;
            this.term = term;
            this.language = language;
            this.flavor = flavor;
            this.model = model;
            this.personalizationContext = personalizationContext;
            this.captureHistory = captureHistory;
        }

        DictionaryFlavor flavor() {
            return flavor;
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

        WordPersonalizationContext personalizationContext() {
            return personalizationContext;
        }

        boolean captureHistory() {
            return captureHistory;
        }
    }

    // 统一通过归一化词条访问缓存，防止因输入噪声导致重复请求模型。
    private Optional<Word> findCachedWord(String normalizedTerm, Language language, DictionaryFlavor flavor) {
        if (normalizedTerm == null || normalizedTerm.isBlank()) {
            return Optional.empty();
        }
        return wordRepository.findActiveByNormalizedTerm(normalizedTerm, language, flavor);
    }

    private String serialize(Word word) throws JsonProcessingException {
        return serializeResponse(toResponse(word));
    }

    private String serializeResponse(WordResponse response) throws JsonProcessingException {
        return objectMapper.writeValueAsString(response);
    }

    private Word saveWord(String requestedTerm, WordResponse resp, Language language, DictionaryFlavor flavor) {
        String preferredTerm = resp.getTerm() != null ? resp.getTerm() : requestedTerm;
        if (preferredTerm == null || preferredTerm.isBlank()) {
            throw new IllegalArgumentException("Term must not be blank when persisting word");
        }
        String term = preferredTerm.trim();
        Language lang = resp.getLanguage() != null ? resp.getLanguage() : language;
        DictionaryFlavor resolvedFlavor = resp.getFlavor() != null ? resp.getFlavor() : flavor;
        String normalizedTerm = resolveNormalizedKey(requestedTerm, term);
        Word word = findCachedWord(normalizedTerm, lang, resolvedFlavor).orElseGet(Word::new);
        word.setTerm(term);
        word.setNormalizedTerm(normalizedTerm);
        word.setLanguage(lang);
        word.setFlavor(resolvedFlavor);
        word.setMarkdown(resp.getMarkdown());
        word.setDefinitions(resp.getDefinitions());
        word.setVariations(resp.getVariations());
        word.setSynonyms(resp.getSynonyms());
        word.setAntonyms(resp.getAntonyms());
        word.setRelated(resp.getRelated());
        word.setPhrases(resp.getPhrases());
        word.setExample(resp.getExample());
        word.setPhonetic(resp.getPhonetic());
        log.info("Persisting word '{}' with language {} flavor {}", term, lang, resolvedFlavor);
        Word saved = wordRepository.save(word);
        resp.setId(String.valueOf(saved.getId()));
        resp.setLanguage(lang);
        resp.setTerm(term);
        resp.setMarkdown(word.getMarkdown());
        resp.setFlavor(resolvedFlavor);
        return saved;
    }

    /**
     * 意图：统一生成用于缓存命中的归一化键，确保保存与读取使用相同标准。\
     * 输入：
     *  - requestedTerm：用户原始查询词，可能包含噪声或为空。\
     *  - persistedTerm：准备写入数据库的展示词，通常来自模型返回。\
     * 输出：归一化后的缓存键字符串。
     * 流程：
     *  1) 优先使用用户输入执行归一化，保持与缓存命中一致。\
     *  2) 若输入归一化为空，则回退到模型展示词。\
     * 错误处理：当两者归一化结果均为空时抛出非法参数异常，以避免脏数据。\
     * 复杂度：O(n)，n 为词条长度，主要由归一化流程开销决定。
     */
    private String resolveNormalizedKey(String requestedTerm, String persistedTerm) {
        String requestedNormalized = termNormalizer.normalize(requestedTerm);
        if (requestedNormalized != null && !requestedNormalized.isBlank()) {
            return requestedNormalized;
        }
        String persistedNormalized = termNormalizer.normalize(persistedTerm);
        if (persistedNormalized == null || persistedNormalized.isBlank()) {
            throw new IllegalArgumentException("Normalized term must not be blank when persisting word");
        }
        return persistedNormalized;
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
            null,
            word.getFlavor()
        );
    }

    private WordResponse applyPersonalization(Long userId, WordResponse response, WordPersonalizationContext context) {
        if (response == null) {
            return null;
        }
        try {
            WordPersonalizationContext effectiveContext = context != null
                ? context
                : wordPersonalizationService.resolveContext(userId);
            response.setPersonalization(wordPersonalizationService.personalize(effectiveContext, response));
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
