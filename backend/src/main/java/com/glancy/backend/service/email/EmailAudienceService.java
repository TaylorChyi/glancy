package com.glancy.backend.service.email;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailAudience;
import com.glancy.backend.entity.EmailStream;
import com.glancy.backend.entity.EmailSuppressionStatus;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.EmailAudienceRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Centralizes subscription and suppression policy enforcement prior to dispatching emails. */
@Service
public class EmailAudienceService {

    private final EmailAudienceRepository repository;
    private final EmailVerificationProperties properties;
    private final Clock clock;

    public EmailAudienceService(
            EmailAudienceRepository repository, EmailVerificationProperties properties, Clock clock) {
        this.repository = repository;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public EmailAudience ensureTransactionalConsent(String email) {
        return ensureConsent(email, EmailStream.TRANSACTIONAL);
    }

    @Transactional
    public EmailAudience ensureConsent(String email, EmailStream stream) {
        String normalized = normalize(email);
        LocalDateTime now = LocalDateTime.now(clock);
        EmailAudience audience = repository
                .findByEmailAndStream(normalized, stream)
                .orElseGet(() -> repository.save(new EmailAudience(normalized, stream, now)));

        guardAgainstInactivity(audience, now);
        guardAgainstUnsubscribe(audience);
        guardAgainstSuppression(audience);

        audience.registerInteraction(now);
        return repository.save(audience);
    }

    @Transactional
    public void recordDeliverySuccess(EmailAudience audience, LocalDateTime timestamp) {
        audience.markDelivered(timestamp);
        repository.save(audience);
    }

    @Transactional
    public void recordDeliveryFailure(
            String email, EmailStream stream, EmailDeliveryFailure failure, LocalDateTime timestamp) {
        Optional<EmailAudience> optional = repository.findByEmailAndStream(normalize(email), stream);
        if (optional.isEmpty()) {
            return;
        }
        EmailAudience audience = optional.get();
        audience.registerBounce(failure.permanent(), timestamp);
        if (failure.shouldSuppress()) {
            audience.setSuppressionStatus(failure.suppressionStatus(), failure.description(), timestamp);
        } else {
            evaluateBounceThresholds(audience, timestamp);
        }
        repository.save(audience);
    }

    public String normalize(String email) {
        if (!StringUtils.hasText(email)) {
            throw new InvalidRequestException("邮箱不能为空");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void guardAgainstInactivity(EmailAudience audience, LocalDateTime now) {
        Duration threshold = properties.getAudiencePolicy().getInactivityThreshold();
        if (threshold == null || threshold.isZero() || threshold.isNegative()) {
            return;
        }
        LocalDateTime lastInteraction = audience.getLastInteractionAt();
        if (lastInteraction == null) {
            return;
        }
        if (lastInteraction.isBefore(now.minus(threshold))) {
            audience.setSubscribed(false, now);
            repository.save(audience);
            throw new InvalidRequestException("该邮箱因长期未互动已停止发送");
        }
    }

    private void guardAgainstUnsubscribe(EmailAudience audience) {
        if (Boolean.FALSE.equals(audience.getSubscribed())) {
            throw new InvalidRequestException("该邮箱已退订此类通知");
        }
    }

    private void guardAgainstSuppression(EmailAudience audience) {
        if (audience.getSuppressionStatus().isSuppressed()) {
            throw new InvalidRequestException("该邮箱当前处于暂停发送状态");
        }
    }

    private void evaluateBounceThresholds(EmailAudience audience, LocalDateTime timestamp) {
        int hardThreshold = Math.max(1, properties.getAudiencePolicy().getHardBounceSuppressionThreshold());
        int softThreshold = Math.max(1, properties.getAudiencePolicy().getSoftBounceSuppressionThreshold());
        if (audience.getHardBounceCount() >= hardThreshold) {
            audience.setSuppressionStatus(EmailSuppressionStatus.HARD_BOUNCE, "累计硬退信次数超限", timestamp);
            return;
        }
        if (audience.getSoftBounceCount() >= softThreshold) {
            audience.setSuppressionStatus(EmailSuppressionStatus.SOFT_BOUNCE, "累计软退信次数超限", timestamp);
        }
    }
}
