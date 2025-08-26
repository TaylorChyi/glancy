package com.glancy.backend.service.tts;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.ForbiddenException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.service.tts.config.TtsConfig;
import com.glancy.backend.service.tts.config.TtsConfigManager;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.Locale;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** Validates synthesis parameters against runtime configuration and user privileges. */
@Component
@Slf4j
public class TtsRequestValidator {

  private final TtsConfigManager configManager;

  public TtsRequestValidator(TtsConfigManager configManager) {
    this.configManager = configManager;
  }

  /**
   * Validate the request and determine the actual voice to use. The returned voice id accounts for
   * defaults and ensures the user has access to the selected option.
   *
   * @return resolved voice id
   */
  public String resolveVoice(User user, TtsRequest request) {
    log.debug(
        "Resolving voice for user={}, lang={}, requestedVoice={}, textPreview={}",
        user.getId(),
        request.getLang(),
        request.getVoice(),
        SensitiveDataUtil.previewText(request.getText()));

    Map<String, TtsConfig.VoiceGroup> voices = configManager.current().getVoices();
    TtsConfig.VoiceGroup group = voices.get(request.getLang());
    if (group == null) {
      Locale locale = Locale.forLanguageTag(request.getLang());
      String prefix = locale.getLanguage();
      if (StringUtils.hasText(prefix)) {
        log.debug("No exact match for lang={}, trying prefix={}", request.getLang(), prefix);
        group =
            voices.entrySet().stream()
                .filter(e -> e.getKey().startsWith(prefix + "-"))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
      }
    }
    if (group == null) {
      log.warn("Unsupported language user={}, lang={}", user.getId(), request.getLang());
      throw new InvalidRequestException("不支持的语言");
    }

    String voiceId =
        StringUtils.hasText(request.getVoice()) ? request.getVoice() : group.getDefaultVoice();
    if (!StringUtils.hasText(request.getVoice())) {
      log.debug("Using default voice={} for lang={}", voiceId, request.getLang());
    }
    TtsConfig.VoiceOption voice =
        group.getOptions().stream().filter(v -> v.getId().equals(voiceId)).findFirst().orElse(null);
    if (voice == null) {
      log.warn(
          "Invalid voice user={}, lang={}, voice={}", user.getId(), request.getLang(), voiceId);
      throw new InvalidRequestException("无效的音色");
    }

    if ("pro".equalsIgnoreCase(voice.getPlan()) && Boolean.FALSE.equals(user.getMember())) {
      log.warn("Voice={} requires pro plan for user={}", voice.getId(), user.getId());
      throw new ForbiddenException("该音色仅对 Pro 用户开放");
    }

    log.debug("Resolved voice={} for user={}", voice.getId(), user.getId());
    return voice.getId();
  }
}
