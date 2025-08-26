package com.glancy.backend.service.tts;

import com.glancy.backend.dto.TtsRequest;
import com.glancy.backend.dto.TtsResponse;
import com.glancy.backend.dto.VoiceOption;
import com.glancy.backend.dto.VoiceResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.tts.client.VolcengineTtsClient;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * TTS service backed by Volcengine large model API. The implementation keeps responsibilities
 * focused: request validation, rate limiting and caching are expected to be handled by dedicated
 * components. This class only orchestrates the remote call and shapes the response for higher
 * layers.
 */
@Service
@Slf4j
public class VolcengineTtsService implements TtsService {

  private final VolcengineTtsClient client;
  private final TtsRequestValidator validator;
  private final UserService userService;

  public VolcengineTtsService(
      VolcengineTtsClient client, TtsRequestValidator validator, UserService userService) {
    this.client = client;
    this.validator = validator;
    this.userService = userService;
  }

  @Override
  public Optional<TtsResponse> synthesizeWord(Long userId, String ip, TtsRequest request) {
    User user = userService.getUserRaw(userId);
    String voice = validator.resolveVoice(user, request);
    request.setVoice(voice);
    log.debug(
        "Delegating word synthesis to client for user={}, ip={}, lang={}, voice={}",
        userId,
        ip,
        request.getLang(),
        voice);
    resolveVoice(userId, request);
    TtsResponse resp = client.synthesize(userId, request);
    log.debug(
        "Client returned audio for user={}, durationMs={}, fromCache={}",
        userId,
        resp.getDurationMs(),
        resp.isFromCache());
    return Optional.of(resp);
  }

  @Override
  public Optional<TtsResponse> synthesizeSentence(Long userId, String ip, TtsRequest request) {
    User user = userService.getUserRaw(userId);
    String voice = validator.resolveVoice(user, request);
    request.setVoice(voice);
    log.debug(
        "Delegating sentence synthesis to client for user={}, ip={}, lang={}, voice={}",
        userId,
        ip,
        request.getLang(),
        voice);
    resolveVoice(userId, request);
    TtsResponse resp = client.synthesize(userId, request);
    log.debug(
        "Client returned audio for user={}, durationMs={}, fromCache={}",
        userId,
        resp.getDurationMs(),
        resp.isFromCache());
    return Optional.of(resp);
  }

  @Override
  public VoiceResponse listVoices(Long userId, String lang) {
    String voice = client.getDefaultVoice();
    VoiceOption option = new VoiceOption(voice, voice, "all");
    return new VoiceResponse(voice, List.of(option));
  }

  private void resolveVoice(Long userId, TtsRequest request) {
    User user = userService.getUserRaw(userId);
    String voice = validator.resolveVoice(user, request);
    if (!StringUtils.hasText(voice)) {
      throw new InvalidRequestException("无效的音色配置");
    }
    request.setVoice(voice);
  }
}
