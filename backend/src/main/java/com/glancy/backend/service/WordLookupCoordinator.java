package com.glancy.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.llm.parser.ParsedWord;
import com.glancy.backend.llm.service.WordSearcher;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Coordinates the lookup lifecycle for dictionary requests, including caching, personalization and
 * persistence.
 */
@Slf4j
@Component
public class WordLookupCoordinator {

    private final WordSearcher wordSearcher;
    private final WordRepository wordRepository;
    private final SearchRecordService searchRecordService;
    private final SearchResultService searchResultService;
    private final WordPersonalizationService wordPersonalizationService;
    private final ObjectMapper objectMapper;

    public WordLookupCoordinator(
        WordSearcher wordSearcher,
        WordRepository wordRepository,
        SearchRecordService searchRecordService,
        SearchResultService searchResultService,
        WordPersonalizationService wordPersonalizationService
    ) {
        this.wordSearcher = wordSearcher;
        this.wordRepository = wordRepository;
        this.searchRecordService = searchRecordService;
        this.searchResultService = searchResultService;
        this.wordPersonalizationService = wordPersonalizationService;
        this.objectMapper = new ObjectMapper();
    }

    public WordLookupSession openSession(WordLookupRequest request) {
        WordPersonalizationContext personalizationContext = wordPersonalizationService.resolveContext(request.userId());
        SearchRecordRequest recordRequest = new SearchRecordRequest();
        recordRequest.setTerm(request.term());
        recordRequest.setLanguage(request.language());
        recordRequest.setFlavor(request.flavor());
        SearchRecordResponse record = searchRecordService.saveRecord(request.userId(), recordRequest);
        return new WordLookupSession(request, personalizationContext, record);
    }

    public Optional<WordResponse> findCachedWord(WordLookupSession session) {
        return wordRepository
            .findByTermAndLanguageAndFlavorAndDeletedFalse(
                session.request().term(),
                session.request().language(),
                session.request().flavor()
            )
            .map(this::toResponse)
            .map(response -> {
                response.setFlavor(session.request().flavor());
                return applyPersonalization(session, response);
            });
    }

    public WordResponse executeLookup(WordLookupSession session) {
        log.info(
            "Word '{}' not found locally or forceNew requested, searching via LLM model {}",
            session.request().term(),
            session.request().model()
        );
        WordResponse remote = wordSearcher.search(
            session.request().term(),
            session.request().language(),
            session.request().flavor(),
            session.request().model(),
            session.personalizationContext()
        );
        log.info("LLM search result: {}", remote);
        return persistResult(session, remote, remote.getMarkdown());
    }

    public Optional<Long> persistStreamResult(WordLookupSession session, ParsedWord parsedWord) {
        WordResponse parsedResponse = parsedWord.parsed();
        WordResponse persisted = persistResult(session, parsedResponse, parsedWord.markdown());
        return persisted.getVersionId() != null ? Optional.of(persisted.getVersionId()) : Optional.empty();
    }

    public String serializeResponse(WordResponse response) throws JsonProcessingException {
        return objectMapper.writeValueAsString(response);
    }

    private WordResponse persistResult(WordLookupSession session, WordResponse response, String versionContentHint) {
        response.setFlavor(session.request().flavor());
        WordResponse personalized = applyPersonalization(session, response);
        Word savedWord = saveWord(session, personalized);
        String versionContent = resolveVersionContent(versionContentHint, savedWord);
        SearchResultVersion version = persistVersion(session, savedWord, versionContent);
        if (version != null) {
            personalized.setVersionId(version.getId());
        }
        return personalized;
    }

    private Word saveWord(WordLookupSession session, WordResponse response) {
        String resolvedTerm = response.getTerm() != null ? response.getTerm() : session.request().term();
        Language resolvedLanguage = response.getLanguage() != null
            ? response.getLanguage()
            : session.request().language();
        DictionaryFlavor resolvedFlavor = response.getFlavor() != null
            ? response.getFlavor()
            : session.request().flavor();
        Word entity = wordRepository
            .findByTermAndLanguageAndFlavorAndDeletedFalse(resolvedTerm, resolvedLanguage, resolvedFlavor)
            .orElseGet(Word::new);
        entity.setTerm(resolvedTerm);
        entity.setLanguage(resolvedLanguage);
        entity.setFlavor(resolvedFlavor);
        entity.setMarkdown(response.getMarkdown());
        entity.setDefinitions(response.getDefinitions());
        entity.setVariations(response.getVariations());
        entity.setSynonyms(response.getSynonyms());
        entity.setAntonyms(response.getAntonyms());
        entity.setRelated(response.getRelated());
        entity.setPhrases(response.getPhrases());
        entity.setExample(response.getExample());
        entity.setPhonetic(response.getPhonetic());
        log.info("Persisting word '{}' with language {} flavor {}", resolvedTerm, resolvedLanguage, resolvedFlavor);
        Word saved = wordRepository.save(entity);
        response.setId(String.valueOf(saved.getId()));
        response.setLanguage(resolvedLanguage);
        response.setTerm(resolvedTerm);
        response.setMarkdown(saved.getMarkdown());
        response.setFlavor(resolvedFlavor);
        return saved;
    }

    private SearchResultVersion persistVersion(WordLookupSession session, Word word, String content) {
        if (session.record() == null || session.record().id() == null) {
            log.warn("Skipping version persistence because search record is unavailable");
            return null;
        }
        return searchResultService.createVersion(
            session.record().id(),
            session.request().userId(),
            word.getTerm(),
            word.getLanguage(),
            session.request().model(),
            content,
            word,
            session.request().flavor()
        );
    }

    private String resolveVersionContent(String candidate, Word savedWord) {
        if (candidate != null) {
            return candidate;
        }
        try {
            return serializeResponse(toResponse(savedWord));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize word '{}' for version content", savedWord.getTerm(), e);
            return SensitiveDataUtil.previewText(savedWord.getMarkdown());
        }
    }

    private WordResponse applyPersonalization(WordLookupSession session, WordResponse response) {
        if (response == null) {
            return null;
        }
        try {
            WordPersonalizationContext context = session.personalizationContext() != null
                ? session.personalizationContext()
                : wordPersonalizationService.resolveContext(session.request().userId());
            PersonalizedWordExplanation personalization = wordPersonalizationService.personalize(context, response);
            response.setPersonalization(personalization);
        } catch (Exception ex) {
            log.warn(
                "Failed to personalize response for user {} term '{}': {}",
                session.request().userId(),
                response.getTerm(),
                SensitiveDataUtil.previewText(ex.getMessage())
            );
        }
        return response;
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

    public record WordLookupRequest(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor,
        String model
    ) {}

    public record WordLookupSession(
        WordLookupRequest request,
        WordPersonalizationContext personalizationContext,
        SearchRecordResponse record
    ) {}
}
