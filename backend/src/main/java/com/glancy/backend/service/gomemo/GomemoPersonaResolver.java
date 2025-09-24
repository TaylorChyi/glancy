package com.glancy.backend.service.gomemo;

import com.glancy.backend.config.GomemoProperties;
import com.glancy.backend.entity.UserProfile;
import com.glancy.backend.gomemo.model.GomemoPersona;
import com.glancy.backend.repository.UserProfileRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Builds a {@link GomemoPersona} snapshot from stored user profile data.
 */
@Component
public class GomemoPersonaResolver {

    private static final Pattern INTEREST_SPLITTER = Pattern.compile("[,，;；/\\\\]+");

    private final UserProfileRepository userProfileRepository;
    private final GomemoProperties properties;

    public GomemoPersonaResolver(UserProfileRepository userProfileRepository, GomemoProperties properties) {
        this.userProfileRepository = userProfileRepository;
        this.properties = properties;
    }

    public GomemoPersona resolve(Long userId) {
        Optional<UserProfile> profile = userProfileRepository.findByUserId(userId);
        Integer age = profile.map(UserProfile::getAge).orElse(null);
        AgeBand ageBand = AgeBand.fromAge(age);
        Integer dailyTarget = profile.map(UserProfile::getDailyWordTarget).orElse(properties.getDefaultDailyTarget());
        String descriptor = ageBand.descriptor();
        String audience = ageBand.audience();
        String tone = ageBand.tone();
        String goal = profile.map(UserProfile::getGoal).map(this::normalize).orElse(null);
        String futurePlan = profile.map(UserProfile::getFuturePlan).map(this::normalize).orElse(null);
        List<String> interests = profile.map(UserProfile::getInterest).map(this::parseInterests).orElseGet(List::of);
        return new GomemoPersona(age, descriptor, audience, tone, dailyTarget, goal, futurePlan, interests);
    }

    private List<String> parseInterests(String interestText) {
        String normalized = normalize(interestText);
        if (normalized == null) {
            return List.of();
        }
        String[] tokens = INTEREST_SPLITTER.split(normalized);
        List<String> result = new ArrayList<>();
        for (String token : tokens) {
            String trimmed = normalize(token);
            if (trimmed != null) {
                result.add(trimmed);
            }
        }
        if (result.isEmpty()) {
            return List.of();
        }
        return Collections.unmodifiableList(result);
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private enum AgeBand {
        CHILD("好奇心旺盛的小小探索者", "小学阶段伙伴", "明快且充满鼓励"),
        TEEN("目标清晰的少年学习者", "同龄学友", "干练而激励"),
        YOUNG_ADULT("自驱力强的青年进阶者", "初入职场的搭档", "沉稳而富有策略"),
        ADULT("经验沉淀的职场实践者", "经验同频的同事", "沉着且高效"),
        SENIOR("热爱分享的终身学习者", "晚辈听众", "温和且尊重"),
        UNKNOWN("保持好奇的学习者", "身边的朋友", "温暖而自信");

        private final String descriptor;
        private final String audience;
        private final String tone;

        AgeBand(String descriptor, String audience, String tone) {
            this.descriptor = descriptor;
            this.audience = audience;
            this.tone = tone;
        }

        String descriptor() {
            return descriptor;
        }

        String audience() {
            return audience;
        }

        String tone() {
            return tone;
        }

        static AgeBand fromAge(Integer age) {
            if (age == null) {
                return UNKNOWN;
            }
            if (age <= 12) {
                return CHILD;
            }
            if (age <= 18) {
                return TEEN;
            }
            if (age <= 30) {
                return YOUNG_ADULT;
            }
            if (age <= 55) {
                return ADULT;
            }
            return SENIOR;
        }
    }
}
