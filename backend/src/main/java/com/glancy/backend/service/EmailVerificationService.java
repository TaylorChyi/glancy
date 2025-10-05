package com.glancy.backend.service;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailVerificationCode;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.EmailVerificationCodeRepository;
import com.glancy.backend.service.email.EmailDeliveryService;
import com.glancy.backend.service.email.VerificationEmailComposer;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles issuing and validating email verification codes for authentication flows.
 */
@Slf4j
@Service
public class EmailVerificationService {

    private final EmailVerificationCodeRepository repository;
    private final EmailVerificationProperties properties;
    private final VerificationEmailComposer emailComposer;
    private final EmailDeliveryService emailDeliveryService;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(
        EmailVerificationCodeRepository repository,
        EmailVerificationProperties properties,
        EmailDeliveryService emailDeliveryService,
        VerificationEmailComposer emailComposer,
        Clock clock
    ) {
        this.repository = repository;
        this.properties = properties;
        this.emailDeliveryService = emailDeliveryService;
        this.emailComposer = emailComposer;
        this.clock = clock;
    }

    /**
     * Issue a new verification code for the given email and invalidate previous active codes.
     */
    @Transactional
    public void issueCode(String email, EmailVerificationPurpose purpose) {
        String normalizedEmail = normalize(email);
        LocalDateTime now = LocalDateTime.now(clock);
        log.info("Starting verification code issuance for {} with purpose {} at {}", normalizedEmail, purpose, now);
        invalidateExisting(normalizedEmail, purpose, now);

        EmailVerificationCode code = new EmailVerificationCode();
        code.setEmail(normalizedEmail);
        code.setPurpose(purpose);
        code.setCode(generateCode());
        code.setExpiresAt(now.plus(properties.getTtl()));
        repository.save(code);
        log.info(
            "Persisted verification code entity {} for {} expiring at {}",
            code.getId(),
            normalizedEmail,
            code.getExpiresAt()
        );

        dispatchEmail(normalizedEmail, purpose, code.getCode(), code.getExpiresAt());
    }

    /**
     * Validate and consume a verification code.
     */
    @Transactional
    public void consumeCode(String email, String code, EmailVerificationPurpose purpose) {
        String normalizedEmail = normalize(email);
        LocalDateTime now = LocalDateTime.now(clock);
        log.info("Consuming verification code for {} with purpose {} at {}", normalizedEmail, purpose, now);
        repository.markExpiredAsUsed(normalizedEmail, purpose, now);
        EmailVerificationCode latest = repository
            .findTopByEmailAndPurposeAndCodeAndDeletedFalseOrderByCreatedAtDesc(normalizedEmail, purpose, code)
            .orElseThrow(() -> new InvalidRequestException("验证码无效或已过期"));

        if (Boolean.TRUE.equals(latest.getUsed()) || latest.getExpiresAt().isBefore(now)) {
            latest.setUsed(true);
            repository.save(latest);
            log.warn(
                "Verification code {} for {} purpose {} already used or expired at {}",
                latest.getId(),
                normalizedEmail,
                purpose,
                now
            );
            throw new InvalidRequestException("验证码无效或已过期");
        }

        latest.setUsed(true);
        repository.save(latest);
        log.info(
            "Verification code {} for {} purpose {} consumed successfully",
            latest.getId(),
            normalizedEmail,
            purpose
        );
    }

    private void invalidateExisting(String email, EmailVerificationPurpose purpose, LocalDateTime now) {
        repository.markExpiredAsUsed(email, purpose, now);
        List<EmailVerificationCode> active = repository.findByEmailAndPurposeAndUsedFalseAndDeletedFalse(
            email,
            purpose
        );
        if (active.isEmpty()) {
            log.info("No active verification codes to invalidate for {} purpose {}", email, purpose);
            return;
        }
        log.info("Marking {} active verification codes as used for {} purpose {}", active.size(), email, purpose);
        active.forEach(code -> code.setUsed(true));
        repository.saveAll(active);
    }

    private String normalize(String email) {
        if (email == null) {
            throw new InvalidRequestException("邮箱不能为空");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateCode() {
        int length = properties.getCodeLength();
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(random.nextInt(10));
        }
        return builder.toString();
    }

    private void dispatchEmail(String email, EmailVerificationPurpose purpose, String code, LocalDateTime expiresAt) {
        MimeMessage message = emailDeliveryService.createMessage();
        try {
            log.info(
                "Preparing verification email payload for {} purpose {} expiring at {}",
                email,
                purpose,
                expiresAt
            );
            emailComposer.populate(message, email, purpose, code, expiresAt);
            emailDeliveryService.sendTransactional(message, email);
            log.info("Dispatched verification email to {} for purpose {} with expiry {}", email, purpose, expiresAt);
        } catch (MessagingException | MailException e) {
            log.error("Failed to compose verification email", e);
            throw new IllegalStateException("邮件发送失败，请稍后重试");
        }
    }

    /**
     * 意图：基于模板方法复用 {@link #invalidateExisting(String, EmailVerificationPurpose, LocalDateTime)} 的核心流程，
     *      为解绑或业务取消场景快速失效验证码，避免遗留请求继续生效。
     * 输入：email（需要清理验证码的邮箱地址），purpose（验证码用途枚举）。
     * 输出：无显式返回，通过持久层将相关验证码标记为已使用。
     * 流程：
     *  1) 归一化邮箱，确保大小写和空白一致；
     *  2) 计算当前时间戳；
     *  3) 调用模板方法统一完成过期与活跃验证码的失效处理。
     * 错误处理：邮箱为空时抛出业务异常，底层数据库或邮件异常向上传递。
     * 复杂度：O(n) —— n 为同一邮箱、用途下仍活跃验证码数量，通常极小。
     */
    @Transactional
    public void invalidateCodes(String email, EmailVerificationPurpose purpose) {
        String normalizedEmail = normalize(email);
        LocalDateTime now = LocalDateTime.now(clock);
        log.info("Invalidating verification codes for {} with purpose {} at {}", normalizedEmail, purpose, now);
        invalidateExisting(normalizedEmail, purpose, now);
    }
}
