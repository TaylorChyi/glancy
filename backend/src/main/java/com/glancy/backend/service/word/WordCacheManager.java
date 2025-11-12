package com.glancy.backend.service.word;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WordCacheManager {

    private final WordRepository wordRepository;
    private final DictionaryTermNormalizer termNormalizer;
    private final ObjectMapper objectMapper;

    public Optional<Word> findCachedWord(String normalizedTerm, Language language, DictionaryFlavor flavor) {
        if (normalizedTerm == null || normalizedTerm.isBlank()) {
            return Optional.empty();
        }
        return wordRepository.findActiveByNormalizedTerm(normalizedTerm, language, flavor);
    }

    public Word saveWord(String requestedTerm, WordResponse resp, Language language, DictionaryFlavor flavor) {
        WordPersistenceContext context = buildContext(requestedTerm, resp, language, flavor);
        Word word = findCachedWord(context.normalizedTerm(), context.language(), context.flavor()).orElseGet(Word::new);
        applyResponseToWord(word, resp, context);
        log.info(
            "Persisting word '{}' with language {} flavor {}",
            context.term(),
            context.language(),
            context.flavor()
        );
        Word saved = wordRepository.save(word);
        syncResponse(resp, saved, context);
        return saved;
    }

    public WordResponse toResponse(Word word) {
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

    public String serializeWord(Word word) throws JsonProcessingException {
        return serializeResponse(toResponse(word));
    }

    public String serializeResponse(WordResponse response) throws JsonProcessingException {
        return objectMapper.writeValueAsString(response);
    }

    public String resolveNormalizedKey(String requestedTerm, String persistedTerm) {
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

    private WordPersistenceContext buildContext(
        String requestedTerm,
        WordResponse resp,
        Language language,
        DictionaryFlavor flavor
    ) {
        String preferredTerm = resp.getTerm() != null ? resp.getTerm() : requestedTerm;
        if (preferredTerm == null || preferredTerm.isBlank()) {
            throw new IllegalArgumentException("Term must not be blank when persisting word");
        }
        String term = preferredTerm.trim();
        Language resolvedLanguage = resp.getLanguage() != null ? resp.getLanguage() : language;
        DictionaryFlavor resolvedFlavor = resp.getFlavor() != null ? resp.getFlavor() : flavor;
        String normalizedTerm = resolveNormalizedKey(requestedTerm, term);
        return new WordPersistenceContext(term, resolvedLanguage, resolvedFlavor, normalizedTerm);
    }

    private void applyResponseToWord(Word word, WordResponse resp, WordPersistenceContext context) {
        word.setTerm(context.term());
        word.setNormalizedTerm(context.normalizedTerm());
        word.setLanguage(context.language());
        word.setFlavor(context.flavor());
        word.setMarkdown(resp.getMarkdown());
        word.setDefinitions(resp.getDefinitions());
        word.setVariations(resp.getVariations());
        word.setSynonyms(resp.getSynonyms());
        word.setAntonyms(resp.getAntonyms());
        word.setRelated(resp.getRelated());
        word.setPhrases(resp.getPhrases());
        word.setExample(resp.getExample());
        word.setPhonetic(resp.getPhonetic());
    }

    private void syncResponse(WordResponse resp, Word saved, WordPersistenceContext context) {
        resp.setId(String.valueOf(saved.getId()));
        resp.setLanguage(context.language());
        resp.setTerm(context.term());
        resp.setMarkdown(saved.getMarkdown());
        resp.setFlavor(context.flavor());
    }

    private record WordPersistenceContext(
        String term,
        Language language,
        DictionaryFlavor flavor,
        String normalizedTerm
    ) {}
}
