package com.glancy.backend.service.tts.quota;

import com.glancy.backend.entity.TtsUsage;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.QuotaExceededException;
import com.glancy.backend.repository.TtsUsageRepository;
import com.glancy.backend.service.tts.config.TtsConfig;
import com.glancy.backend.service.tts.config.TtsConfigManager;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Enforces and records per-user synthesis quotas. */
@Service
@Slf4j
public class TtsQuotaService {

  private final TtsUsageRepository usageRepository;
  private final TtsConfigManager configManager;
  private final Clock clock;

  public TtsQuotaService(
      TtsUsageRepository usageRepository, TtsConfigManager configManager, Clock clock) {
    this.usageRepository = usageRepository;
    this.configManager = configManager;
    this.clock = clock;
  }

  /** Validate that the user still has remaining quota for today. */
  public void verifyQuota(User user) {
    int limit = quotaLimit(user);
    LocalDate today = LocalDate.now(clock);
    Optional<TtsUsage> usageOpt = usageRepository.findByUserIdAndDate(user.getId(), today);
    if (usageOpt.map(TtsUsage::getCount).orElse(0) >= limit) {
      log.warn("User {} exceeded daily TTS quota", user.getId());
      throw new QuotaExceededException("今日配额已用完");
    }
  }

  /**
   * Record a successful synthesis for the user. This should be invoked only after the synthesis
   * completes to align with billing semantics.
   */
  @Transactional
  public void recordUsage(User user) {
    int limit = quotaLimit(user);
    LocalDate today = LocalDate.now(clock);
    TtsUsage usage = usageRepository.findByUserIdAndDate(user.getId(), today).orElse(null);
    if (usage == null) {
      usage = new TtsUsage();
      usage.setUser(user);
      usage.setDate(today);
      usage.setCount(1);
    } else {
      if (usage.getCount() >= limit) {
        log.warn("User {} exceeded daily TTS quota during record", user.getId());
        throw new QuotaExceededException("今日配额已用完");
      }
      usage.setCount(usage.getCount() + 1);
    }
    usageRepository.save(usage);
  }

  private int quotaLimit(User user) {
    TtsConfig cfg = configManager.current();
    return Boolean.TRUE.equals(user.getMember())
        ? cfg.getQuota().getDaily().getPro()
        : cfg.getQuota().getDaily().getFree();
  }
}
