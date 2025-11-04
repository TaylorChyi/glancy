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

/**
 * 背景：
 *  - 词条缓存的查找、序列化与持久化散落在 WordService 中，重复代码多且不易测试。\
 * 目的：
 *  - 将与本地词条缓存相关的职责集中管理，确保保存与读取遵循一致的归一化规则。\
 * 关键决策与取舍：
 *  - 采用组合而非继承来复用 `DictionaryTermNormalizer` 与 `WordRepository`，便于独立测试；\
 *  - 序列化逻辑复用同一 `ObjectMapper`，避免多处创建实例造成资源浪费。\
 * 影响范围：
 *  - WordService 及查词策略通过该组件访问缓存并完成响应转换。\
 * 演进与TODO：
 *  - 未来若接入多级缓存，可在此扩展命中统计或添加分布式缓存适配。
 */
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
}
