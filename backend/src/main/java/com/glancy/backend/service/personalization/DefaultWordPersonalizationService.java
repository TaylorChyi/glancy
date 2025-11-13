package com.glancy.backend.service.personalization;

import com.glancy.backend.dto.PersonalizedWordExplanation;
import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.UserProfile;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.UserProfileRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class DefaultWordPersonalizationService implements WordPersonalizationService {

    private static final int RECENT_HISTORY_LIMIT = 5;
    private static final Pattern INTEREST_SPLITTER = Pattern.compile("[,，;；/\\\\]+");
    private static final int DAILY_TARGET_SPRINT = 60;
    private static final int DAILY_TARGET_PROGRESSIVE = 30;
    private static final List<PersonaClassifier> PERSONA_CLASSIFIERS =
            PersonaClassifierRegistry.build(DAILY_TARGET_SPRINT, DAILY_TARGET_PROGRESSIVE);

    private final UserProfileRepository userProfileRepository;
    private final SearchRecordRepository searchRecordRepository;
    private final PersonalizationNarrativeBuilder narrativeBuilder;

    public DefaultWordPersonalizationService(
            UserProfileRepository userProfileRepository,
            SearchRecordRepository searchRecordRepository,
            PersonalizationNarrativeBuilder narrativeBuilder) {
        this.userProfileRepository = userProfileRepository;
        this.searchRecordRepository = searchRecordRepository;
        this.narrativeBuilder = narrativeBuilder;
    }

    @Override
    public WordPersonalizationContext resolveContext(Long userId) {
        Optional<UserProfile> profile = userProfileRepository.findByUserId(userId);
        PersonaProfile personaProfile = resolvePersonaProfile(profile);
        String goal = profile.map(UserProfile::getGoal).map(this::normalizeText).orElse(null);
        List<String> interests =
                profile.map(UserProfile::getInterest).map(this::parseInterests).orElseGet(List::of);
        String responseStyle = profile.map(UserProfile::getResponseStyle)
                .map(this::normalizeText)
                .filter(StringUtils::hasText)
                .orElse(null);
        List<String> recentTerms = fetchRecentTerms(userId);
        return new WordPersonalizationContext(
                personaProfile.descriptor(),
                personaProfile.derivedFromProfile(),
                personaProfile.audience(),
                goal,
                responseStyle != null ? responseStyle : personaProfile.preferredTone(),
                interests,
                recentTerms);
    }

    private PersonaProfile resolvePersonaProfile(Optional<UserProfile> profile) {
        PersonaInput input = profile.map(this::toPersonaInput).orElse(PersonaInput.empty());
        for (PersonaClassifier classifier : PERSONA_CLASSIFIERS) {
            Optional<PersonaProfile> persona = classifier.classify(input);
            if (persona.isPresent()) {
                return persona.get();
            }
        }
        return PersonaProfile.fallback();
    }

    private PersonaInput toPersonaInput(UserProfile profile) {
        return new PersonaInput(
                normalizeText(profile.getJob()),
                profile.getDailyWordTarget(),
                normalizeText(profile.getGoal()),
                normalizeText(profile.getFuturePlan()));
    }

    @Override
    public PersonalizedWordExplanation personalize(WordPersonalizationContext context, WordResponse response) {
        PersonaProfile fallbackPersona = PersonaProfile.fallback();
        WordPersonalizationContext effectiveContext = context != null
                ? context
                : new WordPersonalizationContext(
                        fallbackPersona.descriptor(),
                        false,
                        fallbackPersona.audience(),
                        null,
                        fallbackPersona.preferredTone(),
                        List.of(),
                        List.of());
        return narrativeBuilder.compose(effectiveContext, response);
    }

    private List<String> fetchRecentTerms(Long userId) {
        List<SearchRecord> records = searchRecordRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(
                userId, PageRequest.of(0, RECENT_HISTORY_LIMIT));
        if (records.isEmpty()) {
            return List.of();
        }
        Set<String> deduplicated = new LinkedHashSet<>();
        for (SearchRecord record : records) {
            String term = normalizeText(record.getTerm());
            if (term != null) {
                deduplicated.add(term);
            }
            if (deduplicated.size() >= RECENT_HISTORY_LIMIT) {
                break;
            }
        }
        return List.copyOf(deduplicated);
    }

    private String normalizeText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> parseInterests(String interestText) {
        String normalized = normalizeText(interestText);
        if (normalized == null) {
            return List.of();
        }
        String[] tokens = INTEREST_SPLITTER.split(normalized);
        List<String> interests = new ArrayList<>();
        for (String token : tokens) {
            String value = normalizeText(token);
            if (value != null) {
                interests.add(value);
            }
        }
        if (interests.isEmpty()) {
            return List.of();
        }
        return Collections.unmodifiableList(interests);
    }
}
