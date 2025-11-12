package com.glancy.backend.config;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

/**
 * Additional metadata that helps mailbox providers evaluate authenticity of transactional mails.
 */
public class EmailVerificationDeliverabilityProperties {

    private String feedbackIdPrefix;
    private String entityRefIdPrefix;
    private Map<String, MailboxProviderPolicy> mailboxProviderPolicies = new LinkedHashMap<>();

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

    public Map<String, MailboxProviderPolicy> getMailboxProviderPolicies() {
        return mailboxProviderPolicies;
    }

    public void setMailboxProviderPolicies(Map<String, MailboxProviderPolicy> mailboxProviderPolicies) {
        this.mailboxProviderPolicies = mailboxProviderPolicies == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(mailboxProviderPolicies);
    }

    void validate(EmailVerificationComplianceProperties compliance) {
        for (Map.Entry<String, MailboxProviderPolicy> entry : mailboxProviderPolicies.entrySet()) {
            entry.getValue().validate(entry.getKey(), compliance);
        }
    }

    public static class MailboxProviderPolicy {

        private List<String> domains = new ArrayList<>();
        private String listId;
        private String complaintsMailto;
        private boolean enforceListUnsubscribe = true;

        public List<String> getDomains() {
            return domains;
        }

        public void setDomains(List<String> domains) {
            this.domains = domains == null ? new ArrayList<>() : new ArrayList<>(domains);
        }

        public String getListId() {
            return listId;
        }

        public void setListId(String listId) {
            this.listId = listId;
        }

        public String getComplaintsMailto() {
            return complaintsMailto;
        }

        public void setComplaintsMailto(String complaintsMailto) {
            this.complaintsMailto = complaintsMailto;
        }

        public boolean isEnforceListUnsubscribe() {
            return enforceListUnsubscribe;
        }

        public void setEnforceListUnsubscribe(boolean enforceListUnsubscribe) {
            this.enforceListUnsubscribe = enforceListUnsubscribe;
        }

        public boolean appliesTo(String domain) {
            if (!StringUtils.hasText(domain) || CollectionUtils.isEmpty(domains)) {
                return false;
            }
            String normalized = domain.toLowerCase(Locale.ROOT);
            for (String candidate : domains) {
                if (!StringUtils.hasText(candidate)) {
                    continue;
                }
                String trimmed = candidate.trim().toLowerCase(Locale.ROOT);
                if (trimmed.startsWith("*")) {
                    String suffix = trimmed.substring(1);
                    if (normalized.endsWith(suffix)) {
                        return true;
                    }
                } else if (normalized.equals(trimmed)) {
                    return true;
                }
            }
            return false;
        }

        void validate(String key, EmailVerificationComplianceProperties compliance) {
            if (CollectionUtils.isEmpty(domains)) {
                throw new IllegalStateException(
                    "mail.verification.deliverability.mailbox-provider-policies." + key + ".domains must not be empty"
                );
            }
            if (enforceListUnsubscribe) {
                boolean hasMailto = StringUtils.hasText(compliance.getUnsubscribeMailto());
                boolean hasUrl = StringUtils.hasText(compliance.getUnsubscribeUrl());
                if (!hasMailto && !hasUrl) {
                    throw new IllegalStateException(
                        "mail.verification.deliverability.mailbox-provider-policies." +
                        key +
                        " requires unsubscribe configuration"
                    );
                }
            }
        }
    }
}

