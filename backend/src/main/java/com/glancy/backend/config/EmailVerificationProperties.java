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
}
