package com.glancy.backend.service.tts;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.ForbiddenException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.service.tts.config.TtsConfig;
import com.glancy.backend.service.tts.config.TtsConfigManager;
import com.glancy.backend.util.SensitiveDataUtil;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Validates synthesis parameters against runtime configuration and
 * user privileges.
 */
@Component
@Slf4j
public class TtsRequestValidator {

    private final TtsConfigManager configManager;

    public TtsRequestValidator(TtsConfigManager configManager) {
        this.configManager = configManager;
    }

    /**
     * Validate the request and determine the actual voice to use. The
     * returned voice id accounts for defaults and ensures the user has
     * access to the selected option.
     *
     * @return resolved voice id
     */
    public String resolveVoice(User user, TtsRequest request) {
        log.debug(
            "Resolving voice for user={}, lang={}, requestedVoice={}, textPreview={}",
            user.getId(),
            request.getLang(),
            request.getVoice(),
            SensitiveDataUtil.previewText(request.getText())
        );

        TtsConfig.VoiceGroup group = resolveVoiceGroup(user, request);
        TtsConfig.VoiceOption voice = resolveVoiceOption(user, request, group);
        ensureMembership(user, voice);
        log.debug("Resolved voice={} for user={}", voice.getId(), user.getId());
        return voice.getId();
    }

    private TtsConfig.VoiceGroup resolveVoiceGroup(User user, TtsRequest request) {
        Map<String, TtsConfig.VoiceGroup> voices = configManager.current().getVoices();
        TtsConfig.VoiceGroup group = voices.get(request.getLang());
        if (group != null) {
            return group;
        }
        Locale locale = Locale.forLanguageTag(request.getLang());
        String prefix = locale.getLanguage();
        if (StringUtils.hasText(prefix)) {
            log.debug("No exact match for lang={}, trying prefix={}", request.getLang(), prefix);
            group = voices
                .entrySet()
                .stream()
                .filter(e -> e.getKey().startsWith(prefix + "-"))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
        }
        if (group == null) {
            log.warn("Unsupported language user={}, lang={}", user.getId(), request.getLang());
            throw new InvalidRequestException("不支持的语言");
        }
        return group;
    }

    private TtsConfig.VoiceOption resolveVoiceOption(User user, TtsRequest request, TtsConfig.VoiceGroup group) {
        String voiceId = StringUtils.hasText(request.getVoice()) ? request.getVoice() : group.getDefaultVoice();
        if (!StringUtils.hasText(request.getVoice())) {
            log.debug("Using default voice={} for lang={}", voiceId, request.getLang());
        }
        return group
            .getOptions()
            .stream()
            .filter(v -> v.getId().equals(voiceId))
            .findFirst()
            .orElseGet(() -> handleMissingVoice(user, request, voiceId));
    }

    private TtsConfig.VoiceOption handleMissingVoice(User user, TtsRequest request, String voiceId) {
        log.warn("Invalid voice user={}, lang={}, voice={}", user.getId(), request.getLang(), voiceId);
        throw new InvalidRequestException("无效的音色");
    }

    private void ensureMembership(User user, TtsConfig.VoiceOption voice) {
        String planLabel = voice.getPlan();
        Optional<MembershipType> requiredPlan = MembershipType.fromPlanLabel(planLabel);
        if (requiredPlan.isEmpty()) {
            return;
        }
        MembershipType userType = Optional.ofNullable(user.getMembershipType()).orElse(MembershipType.NONE);
        boolean activeMembership = user.hasActiveMembershipAt(LocalDateTime.now());
        if (activeMembership && userType.canAccess(requiredPlan.get())) {
            return;
        }
        log.warn(
            "Voice={} requires plan={} for user={}, userType={}, activeMembership={}",
            voice.getId(),
            planLabel,
            user.getId(),
            userType,
            activeMembership
        );
        String readablePlan = requiredPlan.get().name().toLowerCase(Locale.ROOT);
        throw new ForbiddenException("该音色仅对 " + readablePlan + " 及以上会员开放");
    }
}
