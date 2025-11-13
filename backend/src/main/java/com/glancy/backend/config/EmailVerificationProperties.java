package com.glancy.backend.config;

import com.glancy.backend.entity.EmailVerificationPurpose;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

/** Structured configuration backing the email verification workflow. */
@ConfigurationProperties(prefix = "mail.verification")
public class EmailVerificationProperties {

    private String from;
    private int codeLength = 6;
    private Duration ttl = Duration.ofMinutes(10);
    private Map<EmailVerificationPurpose, EmailVerificationTemplateProperties> templates =
            new EnumMap<>(EmailVerificationPurpose.class);
    private final EmailVerificationSenderProperties sender = new EmailVerificationSenderProperties();
    private final EmailVerificationComplianceProperties compliance = new EmailVerificationComplianceProperties();
    private final EmailVerificationDeliverabilityProperties deliverability =
            new EmailVerificationDeliverabilityProperties();
    private final EmailVerificationInfrastructureProperties infrastructure =
            new EmailVerificationInfrastructureProperties();
    private final EmailVerificationAudiencePolicyProperties audiencePolicy =
            new EmailVerificationAudiencePolicyProperties();
    private final EmailVerificationStreamsProperties streams = new EmailVerificationStreamsProperties();
    private final EmailVerificationLocalizationProperties localization = new EmailVerificationLocalizationProperties();

    @PostConstruct
    void validate() {
        validateSender();
        validateCodeLength();
        validateTtl();
        validateTemplates();
        validateCompliance();
        validateNestedComponents();
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public int getCodeLength() {
        return codeLength;
    }

    public void setCodeLength(int codeLength) {
        this.codeLength = codeLength;
    }

    public Duration getTtl() {
        return ttl;
    }

    public void setTtl(Duration ttl) {
        this.ttl = ttl;
    }

    public Map<EmailVerificationPurpose, EmailVerificationTemplateProperties> getTemplates() {
        return templates;
    }

    public void setTemplates(Map<EmailVerificationPurpose, EmailVerificationTemplateProperties> templates) {
        this.templates = templates;
    }

    public EmailVerificationSenderProperties getSender() {
        return sender;
    }

    public EmailVerificationComplianceProperties getCompliance() {
        return compliance;
    }

    public EmailVerificationDeliverabilityProperties getDeliverability() {
        return deliverability;
    }

    public EmailVerificationInfrastructureProperties getInfrastructure() {
        return infrastructure;
    }

    public EmailVerificationAudiencePolicyProperties getAudiencePolicy() {
        return audiencePolicy;
    }

    public EmailVerificationStreamsProperties getStreams() {
        return streams;
    }

    public EmailVerificationLocalizationProperties getLocalization() {
        return localization;
    }

    private void validateSender() {
        if (!StringUtils.hasText(from)) {
            throw new IllegalStateException("mail.verification.from must be configured");
        }
    }

    private void validateCodeLength() {
        if (codeLength < 4) {
            throw new IllegalStateException("mail.verification.code-length must be at least 4");
        }
    }

    private void validateTtl() {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalStateException("mail.verification.ttl must be positive");
        }
    }

    private void validateTemplates() {
        for (EmailVerificationPurpose purpose : EmailVerificationPurpose.values()) {
            EmailVerificationTemplateProperties template = templates.get(purpose);
            String path = "mail.verification.templates." + purpose.name().toLowerCase();
            if (template == null || !StringUtils.hasText(template.getSubject())) {
                throw new IllegalStateException(path + ".subject must be set");
            }
            if (!StringUtils.hasText(template.getBody())) {
                throw new IllegalStateException(path + ".body must be set");
            }
        }
    }

    private void validateCompliance() {
        if (!StringUtils.hasText(compliance.getUnsubscribeMailto())
                && !StringUtils.hasText(compliance.getUnsubscribeUrl())) {
            throw new IllegalStateException("mail.verification.compliance.unsubscribe contact must be configured");
        }
    }

    private void validateNestedComponents() {
        audiencePolicy.validate();
        infrastructure.validate();
        streams.validate(from);
        deliverability.validate(compliance);
        localization.validate();
    }
}
