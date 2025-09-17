package com.glancy.backend.config;

import com.glancy.backend.entity.EmailVerificationPurpose;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Structured configuration backing the email verification workflow.
 */
@ConfigurationProperties(prefix = "mail.verification")
public class EmailVerificationProperties {

    private String from;
    private int codeLength = 6;
    private Duration ttl = Duration.ofMinutes(10);
    private Map<EmailVerificationPurpose, Template> templates = new EnumMap<>(EmailVerificationPurpose.class);
    private final Sender sender = new Sender();
    private final Compliance compliance = new Compliance();
    private final Deliverability deliverability = new Deliverability();

    @PostConstruct
    void validate() {
        if (from == null || from.isBlank()) {
            throw new IllegalStateException("mail.verification.from must be configured");
        }
        if (codeLength < 4) {
            throw new IllegalStateException("mail.verification.code-length must be at least 4");
        }
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalStateException("mail.verification.ttl must be positive");
        }
        for (EmailVerificationPurpose purpose : EmailVerificationPurpose.values()) {
            Template template = templates.get(purpose);
            if (template == null || template.subject == null || template.subject.isBlank()) {
                throw new IllegalStateException(
                    "mail.verification.templates." + purpose.name().toLowerCase() + ".subject must be set"
                );
            }
            if (template.body == null || template.body.isBlank()) {
                throw new IllegalStateException(
                    "mail.verification.templates." + purpose.name().toLowerCase() + ".body must be set"
                );
            }
        }
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

    public Map<EmailVerificationPurpose, Template> getTemplates() {
        return templates;
    }

    public void setTemplates(Map<EmailVerificationPurpose, Template> templates) {
        this.templates = templates;
    }

    public Sender getSender() {
        return sender;
    }

    public Compliance getCompliance() {
        return compliance;
    }

    public Deliverability getDeliverability() {
        return deliverability;
    }

    /**
     * Template details for a single verification purpose.
     */
    public static class Template {

        private String subject;
        private String body;

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getBody() {
            return body;
        }

        public void setBody(String body) {
            this.body = body;
        }
    }

    /**
     * Sender customization that augments the bare mailbox address.
     */
    public static class Sender {

        private String displayName;
        private String replyTo;

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public String getReplyTo() {
            return replyTo;
        }

        public void setReplyTo(String replyTo) {
            this.replyTo = replyTo;
        }
    }

    /**
     * Compliance block appended to the verification mail for deliverability and policy clarity.
     */
    public static class Compliance {

        private String companyName;
        private String companyAddress;
        private String supportEmail;
        private String website;
        private String unsubscribeUrl;
        private String unsubscribeMailto;

        public String getCompanyName() {
            return companyName;
        }

        public void setCompanyName(String companyName) {
            this.companyName = companyName;
        }

        public String getCompanyAddress() {
            return companyAddress;
        }

        public void setCompanyAddress(String companyAddress) {
            this.companyAddress = companyAddress;
        }

        public String getSupportEmail() {
            return supportEmail;
        }

        public void setSupportEmail(String supportEmail) {
            this.supportEmail = supportEmail;
        }

        public String getWebsite() {
            return website;
        }

        public void setWebsite(String website) {
            this.website = website;
        }

        public String getUnsubscribeUrl() {
            return unsubscribeUrl;
        }

        public void setUnsubscribeUrl(String unsubscribeUrl) {
            this.unsubscribeUrl = unsubscribeUrl;
        }

        public String getUnsubscribeMailto() {
            return unsubscribeMailto;
        }

        public void setUnsubscribeMailto(String unsubscribeMailto) {
            this.unsubscribeMailto = unsubscribeMailto;
        }
    }

    /**
     * Additional metadata that helps mailbox providers evaluate authenticity of transactional mails.
     */
    public static class Deliverability {

        private String feedbackIdPrefix;
        private String entityRefIdPrefix;

        public String getFeedbackIdPrefix() {
            return feedbackIdPrefix;
        }

        public void setFeedbackIdPrefix(String feedbackIdPrefix) {
            this.feedbackIdPrefix = feedbackIdPrefix;
        }

        public String getEntityRefIdPrefix() {
            return entityRefIdPrefix;
        }

        public void setEntityRefIdPrefix(String entityRefIdPrefix) {
            this.entityRefIdPrefix = entityRefIdPrefix;
        }
    }
}
