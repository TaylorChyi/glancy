package com.glancy.backend.service;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailVerificationCode;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.EmailVerificationCodeRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
    private final JavaMailSender mailSender;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(
        EmailVerificationCodeRepository repository,
        EmailVerificationProperties properties,
        JavaMailSender mailSender,
        Clock clock
    ) {
        this.repository = repository;
        this.properties = properties;
        this.mailSender = mailSender;
        this.clock = clock;
    }

    /**
     * Issue a new verification code for the given email and invalidate previous active codes.
     */
    @Transactional
    public void issueCode(String email, EmailVerificationPurpose purpose) {
        String normalizedEmail = normalize(email);
        LocalDateTime now = LocalDateTime.now(clock);
        log.info(
            "Starting verification code issuance for {} with purpose {} at {}",
            normalizedEmail,
            purpose,
            now
        );
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
        log.info(
            "Consuming verification code for {} with purpose {} at {}",
            normalizedEmail,
            purpose,
            now
        );
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
        log.info(
            "Marking {} active verification codes as used for {} purpose {}",
            active.size(),
            email,
            purpose
        );
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
        EmailVerificationProperties.Template template = properties.getTemplates().get(purpose);
        if (template == null) {
            throw new IllegalStateException("Missing email template configuration for purpose " + purpose);
        }
        MimeMessage message = mailSender.createMimeMessage();
        try {
            log.info(
                "Preparing verification email payload for {} purpose {} expiring at {}",
                email,
                purpose,
                expiresAt
            );
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(properties.getFrom());
            helper.setTo(email);
            helper.setSubject(template.getSubject());
            helper.setText(renderBody(template.getBody(), code), false);
            mailSender.send(message);
            log.info(
                "Dispatched verification email to {} for purpose {} with expiry {}",
                email,
                purpose,
                expiresAt
            );
        } catch (MessagingException e) {
            log.error("Failed to compose verification email", e);
            throw new IllegalStateException("邮件发送失败，请稍后重试");
        }
    }

    private String renderBody(String body, String code) {
        long ttlMinutes = properties.getTtl().toMinutes();
        return body.replace("{{code}}", code).replace("{{ttlMinutes}}", String.valueOf(ttlMinutes));
    }
}
