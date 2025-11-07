package com.glancy.backend.service.email;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.service.email.localization.VerificationEmailContentResolver;
import com.glancy.backend.service.email.localization.model.LocalizedVerificationContent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;


@Component
public class VerificationEmailComposer {

    private final EmailVerificationProperties properties;
    private final VerificationEmailContentResolver contentResolver;

    public VerificationEmailComposer(
        EmailVerificationProperties properties,
        VerificationEmailContentResolver contentResolver
    ) {
        this.properties = properties;
        this.contentResolver = contentResolver;
    }

    public void populate(
        MimeMessage message,
        String recipient,
        EmailVerificationPurpose purpose,
        String code,
        LocalDateTime expiresAt,
        String clientIp
    ) throws MessagingException {
        EmailVerificationProperties.Template template = resolveTemplate(purpose);
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
        helper.setTo(recipient);
        helper.setSubject(template.getSubject());
        helper.setSentDate(new Date());
        setSender(helper);
        setReplyTo(helper);

        LocalizedVerificationContent content = contentResolver.resolve(clientIp, code);
        helper.setText(content.plainText(), content.htmlBody());
        helper.setPriority(1);

        applyComplianceHeaders(message, purpose);
        applyArcHeaders(message);
    }

    private EmailVerificationProperties.Template resolveTemplate(EmailVerificationPurpose purpose) {
        EmailVerificationProperties.Template template = properties.getTemplates().get(purpose);
        if (template == null) {
            throw new IllegalStateException("Missing email template configuration for purpose " + purpose);
        }
        return template;
    }

    private void setSender(MimeMessageHelper helper) throws MessagingException {
        String mailbox = properties.getFrom();
        String displayName = properties.getSender().getDisplayName();
        if (!StringUtils.hasText(displayName)) {
            displayName = properties.getCompliance().getCompanyName();
        }
        if (StringUtils.hasText(displayName)) {
            try {
                helper.setFrom(new InternetAddress(mailbox, displayName, StandardCharsets.UTF_8.name()));
                return;
            } catch (UnsupportedEncodingException ex) {
                throw new MessagingException("Unable to encode sender personal name", ex);
            }
        }
        helper.setFrom(mailbox);
    }

    private void setReplyTo(MimeMessageHelper helper) throws MessagingException {
        String replyTo = properties.getSender().getReplyTo();
        if (StringUtils.hasText(replyTo)) {
            helper.setReplyTo(replyTo);
        }
    }

    private void applyComplianceHeaders(MimeMessage message, EmailVerificationPurpose purpose)
        throws MessagingException {
        message.setSentDate(new Date());
        message.setHeader("Auto-Submitted", "auto-generated");
        message.setHeader("X-Auto-Response-Suppress", "All");

        EmailComplianceSupport.buildListUnsubscribeHeader(properties).ifPresent(listUnsubscribe -> {
                try {
                    message.setHeader("List-Unsubscribe", listUnsubscribe);
                    if (EmailComplianceSupport.supportsOneClickUnsubscribe(properties)) {
                        message.setHeader("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
                    }
                } catch (MessagingException exception) {
                    throw new IllegalStateException("无法设置退订头部", exception);
                }
            });

        String feedbackIdPrefix = properties.getDeliverability().getFeedbackIdPrefix();
        if (StringUtils.hasText(feedbackIdPrefix)) {
            String companySlug = EmailComplianceSupport.resolveCompanyName(properties)
                .replaceAll("\\s+", "-")
                .toLowerCase(java.util.Locale.ROOT);
            String feedbackId =
                feedbackIdPrefix + ":" + purpose.name().toLowerCase(java.util.Locale.ROOT) + ":" + companySlug;
            message.setHeader("Feedback-ID", feedbackId);
        }

        String entityRefIdPrefix = properties.getDeliverability().getEntityRefIdPrefix();
        if (StringUtils.hasText(entityRefIdPrefix)) {
            message.setHeader(
                "X-Entity-Ref-ID",
                entityRefIdPrefix + "-" + purpose.name().toLowerCase(java.util.Locale.ROOT)
            );
        }
    }

    private void applyArcHeaders(MimeMessage message) throws MessagingException {
        EmailVerificationProperties.Infrastructure infrastructure = properties.getInfrastructure();
        if (!infrastructure.isArcSealEnabled()) {
            return;
        }
        message.setHeader("ARC-Authentication-Results", infrastructure.getArcAuthenticationResults());
        message.setHeader("ARC-Message-Signature", infrastructure.getArcMessageSignature());
        message.setHeader("ARC-Seal", infrastructure.getArcSeal());
    }
}
