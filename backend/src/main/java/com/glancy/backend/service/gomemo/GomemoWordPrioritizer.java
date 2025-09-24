package com.glancy.backend.service.gomemo;

import com.glancy.backend.config.GomemoProperties;
import com.glancy.backend.entity.GomemoSession;
import com.glancy.backend.entity.GomemoSessionWord;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.Word;
import com.glancy.backend.gomemo.model.GomemoPersona;
import com.glancy.backend.gomemo.model.GomemoPlanWord;
import com.glancy.backend.gomemo.model.GomemoStudyModeType;
import com.glancy.backend.repository.GomemoSessionWordRepository;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

/**
 * Produces prioritised vocabulary candidates for a Gomemo session.
 */
@Component
public class GomemoWordPrioritizer {

    private final SearchRecordRepository searchRecordRepository;
    private final WordRepository wordRepository;
    private final GomemoSessionWordRepository sessionWordRepository;
    private final GomemoProperties properties;

    public GomemoWordPrioritizer(
        SearchRecordRepository searchRecordRepository,
        WordRepository wordRepository,
        GomemoSessionWordRepository sessionWordRepository,
        GomemoProperties properties
    ) {
        this.searchRecordRepository = searchRecordRepository;
        this.wordRepository = wordRepository;
        this.sessionWordRepository = sessionWordRepository;
        this.properties = properties;
    }

    public List<GomemoPlanWord> prioritize(Long userId, GomemoPersona persona, int desiredCount) {
        List<SearchRecord> history = searchRecordRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(
            userId,
            PageRequest.of(0, properties.getSearchHistoryWindow())
        );
        Map<String, Candidate> candidates = aggregateCandidates(history);
        if (candidates.isEmpty()) {
            List<Word> fallback = wordRepository
                .findAll(PageRequest.of(0, properties.getSearchHistoryWindow()))
                .getContent();
            for (Word word : fallback) {
                addCandidate(candidates, word.getLanguage(), word.getTerm(), false, 0);
            }
        }
        GomemoProperties.Scoring scoring = properties.getScoring();
        return candidates
            .values()
            .stream()
            .map(candidate -> enrichCandidate(candidate, persona, scoring))
            .sorted(Comparator.comparingInt(GomemoPlanWord::priorityScore).reversed())
            .limit((long) desiredCount * properties.getPlanOversamplingFactor())
            .toList();
    }

    public List<GomemoPlanWord> reloadFromSession(Long sessionId) {
        return sessionWordRepository
            .findBySessionIdAndDeletedFalseOrderByPriorityScoreDesc(sessionId)
            .stream()
            .map(word ->
                new GomemoPlanWord(
                    word.getTerm(),
                    word.getLanguage(),
                    word.getPriorityScore(),
                    List.copyOf(word.getRationales() != null ? word.getRationales() : List.of()),
                    List.copyOf(word.getRecommendedModes() != null ? word.getRecommendedModes() : Set.of())
                )
            )
            .toList();
    }

    public List<GomemoSessionWord> persistWords(GomemoSession session, List<GomemoPlanWord> words) {
        return words
            .stream()
            .map(planWord -> {
                GomemoSessionWord entity = sessionWordRepository
                    .findTopBySessionIdAndTermAndDeletedFalse(session.getId(), planWord.term())
                    .orElseGet(GomemoSessionWord::new);
                return updateSessionWord(entity, session, planWord);
            })
            .toList();
    }

    private GomemoSessionWord updateSessionWord(GomemoSessionWord entity, GomemoSession session, GomemoPlanWord plan) {
        entity.setSession(session);
        entity.setTerm(plan.term());
        entity.setLanguage(plan.language());
        entity.setPriorityScore(plan.priorityScore());
        entity.setRationales(new ArrayList<>(plan.rationales()));
        entity.setRecommendedModes(new LinkedHashSet<>(plan.recommendedModes()));
        return sessionWordRepository.save(entity);
    }

    private GomemoPlanWord enrichCandidate(
        Candidate candidate,
        GomemoPersona persona,
        GomemoProperties.Scoring scoring
    ) {
        Word word = wordRepository
            .findByTermAndLanguageAndDeletedFalse(candidate.term, candidate.language)
            .orElse(null);
        List<String> rationales = new ArrayList<>();
        int score = scoring.getBaseScore();
        score += Math.max(1, scoring.getRecencyWeight() - candidate.recencyIndex);
        if (candidate.frequency > 1) {
            score += scoring.getFrequencyWeight() * (int) Math.log1p(candidate.frequency);
            rationales.add("多次查询，适合强化巩固");
        } else {
            rationales.add("近期检索优先复习");
        }
        if (candidate.favorite) {
            score += scoring.getFavoriteBonus();
            rationales.add("已收藏，需建立牢固记忆");
        }
        if (word != null) {
            score += applyPersonaSignals(word, persona, rationales, scoring);
        }
        int penalty = computeLengthPenalty(candidate.term, persona, scoring.getAgeLengthPenalty());
        if (penalty > 0) {
            score -= penalty;
            rationales.add("词形稍长，建议拆解记忆");
        }
        List<GomemoStudyModeType> modes = recommendModes(word, candidate, persona);
        return new GomemoPlanWord(
            candidate.term,
            candidate.language,
            Math.max(score, 0),
            List.copyOf(rationales),
            modes
        );
    }

    private int applyPersonaSignals(
        Word word,
        GomemoPersona persona,
        List<String> rationales,
        GomemoProperties.Scoring scoring
    ) {
        int score = 0;
        String searchable = buildSearchableCorpus(word);
        if (!CollectionUtils.isEmpty(persona.interests())) {
            long matches = persona
                .interests()
                .stream()
                .filter(interest -> containsIgnoreCase(searchable, interest))
                .count();
            if (matches > 0) {
                score += scoring.getInterestWeight() * matches;
                rationales.add("贴合兴趣领域：" + String.join("、", persona.interests()));
            }
        }
        if (StringUtils.hasText(persona.goal()) && containsIgnoreCase(searchable, persona.goal())) {
            score += scoring.getGoalWeight();
            rationales.add("助力当前目标：" + SensitiveDataUtil.previewText(persona.goal()));
        }
        if (StringUtils.hasText(persona.futurePlan()) && containsIgnoreCase(searchable, persona.futurePlan())) {
            score += scoring.getFuturePlanWeight();
            rationales.add("对齐未来计划：" + SensitiveDataUtil.previewText(persona.futurePlan()));
        }
        return score;
    }

    private List<GomemoStudyModeType> recommendModes(Word word, Candidate candidate, GomemoPersona persona) {
        Set<GomemoStudyModeType> recommended = new LinkedHashSet<>();
        recommended.add(GomemoStudyModeType.CARD);
        if (word != null) {
            if (!CollectionUtils.isEmpty(word.getDefinitions())) {
                recommended.add(GomemoStudyModeType.MULTIPLE_CHOICE);
            }
            if (!CollectionUtils.isEmpty(word.getVariations()) || candidate.term.length() >= 6) {
                recommended.add(GomemoStudyModeType.SPELLING);
            }
            if (!CollectionUtils.isEmpty(word.getSynonyms()) || !CollectionUtils.isEmpty(word.getAntonyms())) {
                recommended.add(GomemoStudyModeType.VISUAL_ASSOCIATION);
            }
            if (StringUtils.hasText(word.getPhonetic()) || StringUtils.hasText(word.getExample())) {
                recommended.add(GomemoStudyModeType.LISTENING);
            }
        }
        if (!persona.interests().isEmpty()) {
            recommended.add(GomemoStudyModeType.VISUAL_ASSOCIATION);
        }
        return List.copyOf(recommended);
    }

    private String buildSearchableCorpus(Word word) {
        if (word == null) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        if (word.getDefinitions() != null) {
            parts.addAll(word.getDefinitions());
        }
        if (word.getMarkdown() != null) {
            parts.add(word.getMarkdown());
        }
        if (word.getExample() != null) {
            parts.add(word.getExample());
        }
        if (word.getSynonyms() != null) {
            parts.addAll(word.getSynonyms());
        }
        if (word.getAntonyms() != null) {
            parts.addAll(word.getAntonyms());
        }
        if (word.getRelated() != null) {
            parts.addAll(word.getRelated());
        }
        return parts.stream().filter(StringUtils::hasText).collect(Collectors.joining(" ")).toLowerCase(Locale.ROOT);
    }

    private boolean containsIgnoreCase(String haystack, String needle) {
        if (!StringUtils.hasText(haystack) || !StringUtils.hasText(needle)) {
            return false;
        }
        return haystack.contains(needle.toLowerCase(Locale.ROOT));
    }

    private int computeLengthPenalty(String term, GomemoPersona persona, int penaltyWeight) {
        if (persona == null || persona.age() == null) {
            return 0;
        }
        int optimal = persona.age() <= 12 ? 6 : persona.age() <= 18 ? 8 : persona.age() <= 30 ? 10 : 12;
        int extra = Math.max(0, term.length() - optimal);
        return extra * penaltyWeight;
    }

    private Map<String, Candidate> aggregateCandidates(List<SearchRecord> history) {
        Map<String, Candidate> candidates = new LinkedHashMap<>();
        int index = 0;
        for (SearchRecord record : history) {
            addCandidate(
                candidates,
                record.getLanguage(),
                record.getTerm(),
                Boolean.TRUE.equals(record.getFavorite()),
                index
            );
            index++;
        }
        return candidates;
    }

    private void addCandidate(
        Map<String, Candidate> candidates,
        Language language,
        String term,
        boolean favorite,
        int position
    ) {
        if (!StringUtils.hasText(term) || language == null) {
            return;
        }
        String normalizedTerm = term.trim();
        String key = language.name() + ":" + normalizedTerm.toLowerCase(Locale.ROOT);
        Candidate candidate = candidates.computeIfAbsent(key, unused -> new Candidate(normalizedTerm, language));
        candidate.frequency++;
        if (candidate.recencyIndex == Integer.MAX_VALUE) {
            candidate.recencyIndex = position;
        }
        candidate.favorite = candidate.favorite || favorite;
    }

    private static final class Candidate {

        private final String term;
        private final Language language;
        private int frequency = 0;
        private int recencyIndex = Integer.MAX_VALUE;
        private boolean favorite;

        Candidate(String term, Language language) {
            this.term = term;
            this.language = language;
        }
    }
}
