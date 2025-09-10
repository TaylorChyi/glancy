package com.glancy.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.client.DictionaryClient;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.UserPreference;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.parser.WordResponseParser;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.WordRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.SignalType;

/**
 * Performs dictionary lookups via the configured third-party client.
 */
@Slf4j
@Service
public class WordService {

    private final DictionaryClient dictionaryClient;
    private final WordSearcher wordSearcher;
    private final WordRepository wordRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final SearchRecordService searchRecordService;
    private final WordResponseParser parser;

    public WordService(
        @Qualifier("deepSeekClient") DictionaryClient dictionaryClient,
        WordSearcher wordSearcher,
        WordRepository wordRepository,
        UserPreferenceRepository userPreferenceRepository,
        SearchRecordService searchRecordService,
        WordResponseParser parser
    ) {
        this.dictionaryClient = dictionaryClient;
        this.wordSearcher = wordSearcher;
        this.wordRepository = wordRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.searchRecordService = searchRecordService;
        this.parser = parser;
    }

    /**
     * Retrieve pronunciation audio from the configured dictionary service.
     */
    @Transactional(readOnly = true)
    public byte[] getAudio(String term, Language language) {
        log.info("Fetching audio for term '{}' in language {}", term, language);
        return dictionaryClient.fetchAudio(term, language);
    }

    @Transactional
    public WordResponse findWordForUser(Long userId, String term, Language language, String model) {
        log.info("Finding word '{}' for user {} in language {} using model {}", term, userId, language, model);
        userPreferenceRepository
            .findByUserId(userId)
            .orElseGet(() -> {
                log.info("No user preference found for user {}, using default", userId);
                UserPreference p = new UserPreference();
                p.setDictionaryModel(DictionaryModel.DOUBAO);
                return p;
            });
        return wordRepository
            .findByTermAndLanguageAndDeletedFalse(term, language)
            .map(word -> {
                log.info("Found word '{}' in local repository", term);
                return toResponse(word);
            })
            .orElseGet(() -> {
                log.info("Word '{}' not found locally, searching via LLM", term);
                WordResponse resp = wordSearcher.search(term, language, model);
                log.info("LLM search result: {}", resp);
                saveWord(term, resp, language);
                return resp;
            });
    }

    /**
     * Stream search results for a word and persist the search record.
     */
    @Transactional
    public Flux<String> streamWordForUser(Long userId, String term, Language language, String model) {
        log.info("Streaming word '{}' for user {} in language {} using model {}", term, userId, language, model);
        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm(term);
        req.setLanguage(language);
        try {
            searchRecordService.saveRecord(userId, req);
        } catch (Exception e) {
            log.error("Failed to save search record for user {}", userId, e);
            String msg = "Failed to save search record: " + e.getMessage();
            return Flux.error(new IllegalStateException(msg, e));
        }

        var existing = wordRepository.findByTermAndLanguageAndDeletedFalse(term, language);
        if (existing.isPresent()) {
            log.info("Found cached word '{}' in language {}", term, language);
            try {
                return Flux.just(serialize(existing.get()));
            } catch (Exception e) {
                log.error("Failed to serialize cached word '{}'", term, e);
                return Flux.error(new IllegalStateException("Failed to serialize cached word", e));
            }
        }

        StringBuilder buffer = new StringBuilder();
        Flux<String> stream;
        try {
            stream = wordSearcher.streamSearch(term, language, model);
        } catch (Exception e) {
            log.error("Error initiating streaming search for term '{}': {}", term, e.getMessage(), e);
            String msg = "Failed to initiate streaming search: " + e.getMessage();
            return Flux.error(new IllegalStateException(msg, e));
        }

        return stream
            .doOnNext(chunk -> {
                log.info("Streaming chunk for term '{}': {}", term, chunk);
                buffer.append(chunk);
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
            .doFinally(signal -> {
                log.info("Streaming finished for term '{}' with signal {}", term, signal);
                if (signal == SignalType.ON_COMPLETE) {
                    try {
                        ParsedWord parsed = parser.parse(buffer.toString(), term, language);
                        saveWord(term, parsed.parsed(), language);
                    } catch (Exception e) {
                        log.error("Failed to persist streamed word '{}'", term, e);
                    }
                }
            });
    }

    private String serialize(Word word) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(toResponse(word));
    }

    private void saveWord(String requestedTerm, WordResponse resp, Language language) {
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
            word.getMarkdown()
        );
    }
}
