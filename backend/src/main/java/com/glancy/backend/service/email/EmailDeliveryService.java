package com.glancy.backend.service.email;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailAudience;
import com.glancy.backend.entity.EmailStream;
import java.time.Clock;
import java.time.LocalDateTime;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Coordinates outbound email delivery with compliance, subscription, and bounce tracking policies.
 */
@Service
public class EmailDeliveryService {

    private final JavaMailSender mailSender;
    private final EmailAudienceService audienceService;
    private final EmailDeliveryFailureClassifier failureClassifier;
    private final EmailVerificationProperties properties;
    private final Clock clock;

    public EmailDeliveryService(
        JavaMailSender mailSender,
        EmailAudienceService audienceService,
        EmailDeliveryFailureClassifier failureClassifier,
        EmailVerificationProperties properties,
        Clock clock
    ) {
        this.mailSender = mailSender;
        this.audienceService = audienceService;
        this.failureClassifier = failureClassifier;
        this.properties = properties;
        this.clock = clock;
    }

    public MimeMessage createMessage() {
        return mailSender.createMimeMessage();
    }

    public void sendTransactional(MimeMessage message, String recipient) {
        EmailAudience audience = audienceService.ensureTransactionalConsent(recipient);
        LocalDateTime timestamp = LocalDateTime.now(clock);
        try {
            ensureStreamConsistency();
            mailSender.send(message);
            audienceService.recordDeliverySuccess(audience, timestamp);
        } catch (MailException exception) {
            EmailDeliveryFailure failure = failureClassifier.classify(exception);
            audienceService.recordDeliveryFailure(recipient, EmailStream.TRANSACTIONAL, failure, timestamp);
            throw exception;
        }
    }

    private void ensureStreamConsistency() {
        String from = properties.getFrom();
        String transactionalDomain = properties.getStreams().getTransactionalDomain();
        if (from == null || transactionalDomain == null) {
            return;
        }
        int atIndex = from.indexOf('@');
        if (atIndex <= 0 || atIndex == from.length() - 1) {
            return;
        }
        String fromDomain = from.substring(atIndex + 1);
        if (!fromDomain.equalsIgnoreCase(transactionalDomain)) {
            throw new IllegalStateException("发件人与事务域名不一致，已终止发送以防送达异常");
        }
    }
}
