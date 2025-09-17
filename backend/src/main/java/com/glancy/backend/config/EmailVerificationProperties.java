package com.glancy.backend.config;

import com.glancy.backend.entity.EmailVerificationPurpose;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

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
    private final Infrastructure infrastructure = new Infrastructure();
    private final AudiencePolicy audiencePolicy = new AudiencePolicy();
    private final Streams streams = new Streams();

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
        if (
            !StringUtils.hasText(compliance.getUnsubscribeMailto()) &&
            !StringUtils.hasText(compliance.getUnsubscribeUrl())
        ) {
            throw new IllegalStateException("mail.verification.compliance.unsubscribe contact must be configured");
        }
        audiencePolicy.validate();
        infrastructure.validate();
        streams.validate(from);
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

    public Infrastructure getInfrastructure() {
        return infrastructure;
    }

    public AudiencePolicy getAudiencePolicy() {
        return audiencePolicy;
    }

    public Streams getStreams() {
        return streams;
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

    public static class Infrastructure {

        private String reverseDnsDomain;
        private String spfRecord;
        private String dkimSelector;
        private String dmarcPolicy;
        private boolean arcSealEnabled;
        private String arcAuthenticationResults;
        private String arcMessageSignature;
        private String arcSeal;

        public String getReverseDnsDomain() {
            return reverseDnsDomain;
        }

        public void setReverseDnsDomain(String reverseDnsDomain) {
            this.reverseDnsDomain = reverseDnsDomain;
        }

        public String getSpfRecord() {
            return spfRecord;
        }

        public void setSpfRecord(String spfRecord) {
            this.spfRecord = spfRecord;
        }

        public String getDkimSelector() {
            return dkimSelector;
        }

        public void setDkimSelector(String dkimSelector) {
            this.dkimSelector = dkimSelector;
        }

        public String getDmarcPolicy() {
            return dmarcPolicy;
        }

        public void setDmarcPolicy(String dmarcPolicy) {
            this.dmarcPolicy = dmarcPolicy;
        }

        public boolean isArcSealEnabled() {
            return arcSealEnabled;
        }

        public void setArcSealEnabled(boolean arcSealEnabled) {
            this.arcSealEnabled = arcSealEnabled;
        }

        public String getArcAuthenticationResults() {
            return arcAuthenticationResults;
        }

        public void setArcAuthenticationResults(String arcAuthenticationResults) {
            this.arcAuthenticationResults = arcAuthenticationResults;
        }

        public String getArcMessageSignature() {
            return arcMessageSignature;
        }

        public void setArcMessageSignature(String arcMessageSignature) {
            this.arcMessageSignature = arcMessageSignature;
        }

        public String getArcSeal() {
            return arcSeal;
        }

        public void setArcSeal(String arcSeal) {
            this.arcSeal = arcSeal;
        }

        void validate() {
            if (!StringUtils.hasText(reverseDnsDomain)) {
                throw new IllegalStateException(
                    "mail.verification.infrastructure.reverse-dns-domain must be configured"
                );
            }
            if (!StringUtils.hasText(spfRecord)) {
                throw new IllegalStateException("mail.verification.infrastructure.spf-record must be configured");
            }
            if (!StringUtils.hasText(dkimSelector)) {
                throw new IllegalStateException("mail.verification.infrastructure.dkim-selector must be configured");
            }
            if (!StringUtils.hasText(dmarcPolicy)) {
                throw new IllegalStateException("mail.verification.infrastructure.dmarc-policy must be configured");
            }
            if (arcSealEnabled) {
                if (!StringUtils.hasText(arcAuthenticationResults)) {
                    throw new IllegalStateException(
                        "mail.verification.infrastructure.arc-authentication-results must be configured when arcSealEnabled=true"
                    );
                }
                if (!StringUtils.hasText(arcMessageSignature)) {
                    throw new IllegalStateException(
                        "mail.verification.infrastructure.arc-message-signature must be configured when arcSealEnabled=true"
                    );
                }
                if (!StringUtils.hasText(arcSeal)) {
                    throw new IllegalStateException(
                        "mail.verification.infrastructure.arc-seal must be configured when arcSealEnabled=true"
                    );
                }
            }
        }
    }

    public static class AudiencePolicy {

        private Duration inactivityThreshold = Duration.ofDays(365);
        private int softBounceSuppressionThreshold = 3;
        private int hardBounceSuppressionThreshold = 1;

        public Duration getInactivityThreshold() {
            return inactivityThreshold;
        }

        public void setInactivityThreshold(Duration inactivityThreshold) {
            this.inactivityThreshold = inactivityThreshold;
        }

        public int getSoftBounceSuppressionThreshold() {
            return softBounceSuppressionThreshold;
        }

        public void setSoftBounceSuppressionThreshold(int softBounceSuppressionThreshold) {
            this.softBounceSuppressionThreshold = softBounceSuppressionThreshold;
        }

        public int getHardBounceSuppressionThreshold() {
            return hardBounceSuppressionThreshold;
        }

        public void setHardBounceSuppressionThreshold(int hardBounceSuppressionThreshold) {
            this.hardBounceSuppressionThreshold = hardBounceSuppressionThreshold;
        }

        void validate() {
            if (inactivityThreshold == null || inactivityThreshold.isZero() || inactivityThreshold.isNegative()) {
                throw new IllegalStateException(
                    "mail.verification.audience-policy.inactivity-threshold must be positive"
                );
            }
            if (softBounceSuppressionThreshold < 1) {
                throw new IllegalStateException(
                    "mail.verification.audience-policy.soft-bounce-suppression-threshold must be >= 1"
                );
            }
            if (hardBounceSuppressionThreshold < 1) {
                throw new IllegalStateException(
                    "mail.verification.audience-policy.hard-bounce-suppression-threshold must be >= 1"
                );
            }
        }
    }

    public static class Streams {

        private String transactionalDomain;
        private String transactionalIpPool;
        private String marketingDomain;
        private String marketingIpPool;

        public String getTransactionalDomain() {
            return transactionalDomain;
        }

        public void setTransactionalDomain(String transactionalDomain) {
            this.transactionalDomain = transactionalDomain;
        }

        public String getTransactionalIpPool() {
            return transactionalIpPool;
        }

        public void setTransactionalIpPool(String transactionalIpPool) {
            this.transactionalIpPool = transactionalIpPool;
        }

        public String getMarketingDomain() {
            return marketingDomain;
        }

        public void setMarketingDomain(String marketingDomain) {
            this.marketingDomain = marketingDomain;
        }

        public String getMarketingIpPool() {
            return marketingIpPool;
        }

        public void setMarketingIpPool(String marketingIpPool) {
            this.marketingIpPool = marketingIpPool;
        }

        void validate(String from) {
            if (!StringUtils.hasText(transactionalDomain)) {
                throw new IllegalStateException("mail.verification.streams.transactional-domain must be configured");
            }
            if (StringUtils.hasText(marketingDomain) && marketingDomain.equalsIgnoreCase(transactionalDomain)) {
                throw new IllegalStateException(
                    "mail.verification.streams.marketing-domain must differ from transactional-domain for proper segmentation"
                );
            }
            if (StringUtils.hasText(from)) {
                int atIndex = from.indexOf('@');
                if (atIndex > 0 && atIndex < from.length() - 1) {
                    String fromDomain = from.substring(atIndex + 1);
                    if (!fromDomain.equalsIgnoreCase(transactionalDomain)) {
                        throw new IllegalStateException(
                            "mail.verification.from domain must match mail.verification.streams.transactional-domain"
                        );
                    }
                }
            }
        }
    }
}
