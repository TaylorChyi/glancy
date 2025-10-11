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
import com.glancy.backend.llm.stream.SseEventParser;
import com.glancy.backend.llm.stream.StreamDecoder;
import com.glancy.backend.llm.stream.transform.SsePayloadTransformerRegistry;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import com.glancy.backend.service.support.ResponseMarkdownOrSerializedWordStrategy;
import com.glancy.backend.service.support.SanitizedStreamingMarkdownStrategy;
import com.glancy.backend.service.support.WordPersistenceCoordinator;
import com.glancy.backend.service.support.WordPersistenceCoordinator.PersistenceContext;
import com.glancy.backend.service.support.WordPersistenceCoordinator.PersistenceOutcome;
import com.glancy.backend.service.support.WordVersionContentStrategy;
import com.glancy.backend.util.SensitiveDataUtil;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
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
    private final WordPersistenceCoordinator wordPersistenceCoordinator;
    private final StreamDecoder doubaoStreamDecoder;
    private final WordVersionContentStrategy defaultVersionContentStrategy;
    private final WordVersionContentStrategy streamingVersionContentStrategy;
    private final SseEventParser sseEventParser;
    private final SsePayloadTransformerRegistry ssePayloadTransformerRegistry;

    public WordService(
        WordSearcher wordSearcher,
        WordRepository wordRepository,
        SearchRecordService searchRecordService,
        SearchResultService searchResultService,
        WordResponseParser parser,
        WordPersonalizationService wordPersonalizationService,
        DictionaryTermNormalizer termNormalizer,
        ObjectMapper objectMapper,
        WordPersistenceCoordinator wordPersistenceCoordinator,
        @Qualifier("doubaoStreamDecoder") StreamDecoder doubaoStreamDecoder,
        SseEventParser sseEventParser,
        SsePayloadTransformerRegistry ssePayloadTransformerRegistry
    ) {
        this.wordSearcher = wordSearcher;
        this.wordRepository = wordRepository;
        this.searchRecordService = searchRecordService;
        this.searchResultService = searchResultService;
        this.parser = parser;
        this.wordPersonalizationService = wordPersonalizationService;
        this.termNormalizer = termNormalizer;
        this.objectMapper = objectMapper;
        this.wordPersistenceCoordinator = wordPersistenceCoordinator;
        this.doubaoStreamDecoder = doubaoStreamDecoder;
        this.defaultVersionContentStrategy = new ResponseMarkdownOrSerializedWordStrategy();
        this.streamingVersionContentStrategy = new SanitizedStreamingMarkdownStrategy();
        this.sseEventParser = sseEventParser;
        this.ssePayloadTransformerRegistry = ssePayloadTransformerRegistry;
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
        PersistenceOutcome outcome = wordPersistenceCoordinator.persist(
            buildPersistenceContext(
                userId,
                rawTerm,
                language,
                flavor,
                model,
                record != null ? record.id() : null,
                captureHistory,
                resp,
                personalizationContext,
                null
            ),
            defaultVersionContentStrategy
        );
        return outcome.response();
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
            WordResponse response = parsed.parsed();
            response.setFlavor(session.flavor());
            if (!session.captureHistory()) {
                log.info(
                    "History capture disabled for streaming session user {} term '{}' - skipping record persistence",
                    session.userId(),
                    session.term()
                );
            }
            PersistenceOutcome outcome = wordPersistenceCoordinator.persist(
                buildPersistenceContext(
                    session.userId(),
                    session.term(),
                    session.language(),
                    session.flavor(),
                    session.model(),
                    session.recordId(),
                    session.captureHistory(),
                    response,
                    session.personalizationContext(),
                    parsed.markdown()
                ),
                streamingVersionContentStrategy
            );
            SearchResultVersion version = outcome.version();
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

    private PersistenceContext buildPersistenceContext(
        Long userId,
        String requestedTerm,
        Language language,
        DictionaryFlavor flavor,
        String model,
        Long recordId,
        boolean captureHistory,
        WordResponse response,
        WordPersonalizationContext personalizationContext,
        String sanitizedMarkdown
    ) {
        return WordPersistenceCoordinator.builder()
            .userId(userId)
            .requestedTerm(requestedTerm)
            .language(language)
            .flavor(flavor)
            .model(model)
            .recordId(recordId)
            .captureHistory(captureHistory)
            .response(response)
            .personalizationContext(personalizationContext)
            .saveWordStep(this::saveWord)
            .recordSynchronizationStep(this::synchronizeRecordTermQuietly)
            .versionPersistStep(this::persistVersion)
            .personalizationStep(this::applyPersonalization)
            .wordSerializationStep(this::serialize)
            .sanitizedMarkdown(sanitizedMarkdown)
            .build();
    }

    public record StreamPayload(String event, String data) {
        public static StreamPayload data(String data) {
            return new StreamPayload(null, data);
        }

        public static StreamPayload version(String versionId) {
            return new StreamPayload("version", versionId);
        }

        public static StreamPayload fromEvent(String event, String data) {
            String normalizedEvent = "message".equals(event) ? null : event;
            return new StreamPayload(normalizedEvent, data);
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
                    synchronizeRecordTermQuietly(userId, record != null ? record.id() : null, word.getTerm());
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
                synchronizeRecordTermQuietly(userId, record != null ? record.id() : null, cachedWord.getTerm());
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
        Flux<String> rawStream;
        try {
            rawStream = wordSearcher.streamSearch(term, language, flavor, resolvedModel, personalizationContext);
        } catch (BusinessException e) {
            return Flux.error(e);
        } catch (Exception e) {
            log.error("Error initiating streaming search for term '{}'", term, e);
            return Flux.error(
                new IllegalStateException(String.format("Failed to initiate streaming search: %s", e.getMessage()), e)
            );
        }

        // 背景：前端需要获得未经改写的 Doubao SSE，而持久化流程仍依赖解析后的正文。
        // 取舍：通过共享底层流并在需要时套用 StreamDecoder 策略，既保证透传又复用现有解析逻辑。
        boolean decodeRequired = shouldDecode(resolvedModel);
        Flux<String> sharedStream = decodeRequired ? rawStream.publish().autoConnect(2) : rawStream;

        Flux<StreamPayload> main = sharedStream
            .doOnNext(chunk -> {
                log.info("Streaming raw chunk for term '{}': {}", term, chunk);
                session.recordRaw(chunk);
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
            .map(chunk -> toStreamPayload(chunk, term, resolvedModel));

        Flux<StreamPayload> aggregated = decodeRequired
            ? doubaoStreamDecoder
                .decode(sharedStream)
                .doOnNext(chunk -> {
                    log.info("Decoded chunk for term '{}': {}", term, chunk);
                    session.appendDecoded(chunk);
                })
                .doOnError(session::markError)
                .flatMap(chunk -> Flux.<StreamPayload>empty())
            : Flux.empty();

        Flux<StreamPayload> merged = decodeRequired ? Flux.merge(main, aggregated) : main;

        return merged.concatWith(Mono.defer(() -> finalizeStreamingSession(session))).doFinally(session::logSummary);
    }

    private StreamPayload toStreamPayload(String rawChunk, String term, String model) {
        return sseEventParser
            .parse(rawChunk)
            .map(parsed -> {
                String transformed = ssePayloadTransformerRegistry.transform(model, parsed.event(), parsed.data());
                return StreamPayload.fromEvent(parsed.event(), transformed);
            })
            .orElseGet(() -> {
                String stripped = extractDataPayload(rawChunk);
                if (!stripped.isEmpty()) {
                    log.warn("Failed to parse SSE chunk for term '{}', fallback to data-only payload", term);
                    String transformed = ssePayloadTransformerRegistry.transform(model, "message", stripped);
                    return StreamPayload.data(transformed);
                }
                log.warn("Failed to parse SSE chunk for term '{}', fallback to raw payload", term);
                String transformed = ssePayloadTransformerRegistry.transform(model, "message", rawChunk);
                return StreamPayload.data(transformed);
            });
    }

    /**
     * 意图：在解析失败时兜底提取 data 字段，避免二次包裹造成前端解析异常。
     * 输入：完整的原始 SSE 片段，可能包含 CRLF、注释或其他字段。
     * 输出：按换行拼接的 data 内容；不存在 data 字段时返回空字符串。
     * 流程：
     *  1) 统一换行符为 \n；
     *  2) 过滤出以 "data:" 开头的行并去除协议约定的单个空格；
     *  3) 使用换行拼接，保留模型输出中的合法空白。
     * 错误处理：无显式异常；无法提取时返回空字符串交由调用方决定回退策略。
     * 复杂度：O(n)，n 为输入长度。
     */
    private String extractDataPayload(String rawChunk) {
        if (rawChunk == null || rawChunk.isEmpty()) {
            return "";
        }
        String normalized = rawChunk.replace("\r\n", "\n").replace('\r', '\n');
        StringBuilder builder = new StringBuilder();
        for (String line : normalized.split("\n")) {
            if (!line.startsWith("data:")) {
                continue;
            }
            String content = line.substring("data:".length());
            if (!content.isEmpty() && content.charAt(0) == ' ') {
                content = content.substring(1);
            }
            if (builder.length() > 0) {
                builder.append('\n');
            }
            builder.append(content);
        }
        return builder.toString();
    }

    private boolean shouldDecode(String model) {
        return DEFAULT_MODEL.equals(model);
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
        private int rawChunkCount;
        private int decodedChunkCount;
        private boolean error;
        private Throwable failure;
        private String snapshot;
        private String lastRawPreview;
        private String lastChunkPreview;

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

        void recordRaw(String chunk) {
            rawChunkCount++;
            lastRawPreview = SensitiveDataUtil.previewText(chunk);
        }

        void appendDecoded(String chunk) {
            if (chunk == null || chunk.isEmpty()) {
                return;
            }
            decodedChunkCount++;
            transcript.append(chunk);
            snapshot = null;
            lastChunkPreview = SensitiveDataUtil.previewText(chunk);
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
                "rawChunks={}, decodedChunks={}, totalChars={}, durationMs={}, error={}, completionSentinelPresent={}, " +
                "rawPreview={}, decodedPreview={}",
                userId,
                term,
                language,
                model,
                signal,
                rawChunkCount,
                decodedChunkCount,
                aggregated.length(),
                duration,
                errorSummary,
                completion.satisfied(),
                lastRawPreview != null ? lastRawPreview : "<none>",
                lastChunkPreview != null ? lastChunkPreview : SensitiveDataUtil.previewText(aggregated)
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
