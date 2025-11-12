package com.glancy.backend.config;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

/**
 * Structured localization preferences that tune verification content per client locale.
 */
public class EmailVerificationLocalizationProperties {

    private String defaultLanguageTag = Locale.SIMPLIFIED_CHINESE.toLanguageTag();
    private Map<String, Message> messages = new LinkedHashMap<>();
    private List<Rule> rules = new ArrayList<>();

    public String getDefaultLanguageTag() {
        return defaultLanguageTag;
    }

    public void setDefaultLanguageTag(String defaultLanguageTag) {
        this.defaultLanguageTag = defaultLanguageTag;
    }

    public Map<String, Message> getMessages() {
        return messages;
    }

    public void setMessages(Map<String, Message> messages) {
        this.messages = messages;
    }

    public List<Rule> getRules() {
        return rules;
    }

    public void setRules(List<Rule> rules) {
        this.rules = rules;
    }

    void validate() {
        if (!StringUtils.hasText(defaultLanguageTag)) {
            throw new IllegalStateException("mail.verification.localization.default-language-tag must be set");
        }
        if (CollectionUtils.isEmpty(messages)) {
            throw new IllegalStateException("mail.verification.localization.messages must not be empty");
        }
        if (!messages.containsKey(defaultLanguageTag)) {
            throw new IllegalStateException(
                "mail.verification.localization.messages must contain default language tag " + defaultLanguageTag
            );
        }
        messages.forEach((languageTag, message) -> message.validate(languageTag));
        rules.forEach(rule -> rule.validate(messages));
    }

    /**
     * Localized message template used to render verification content.
     */
    public static class Message {

        private String body;

        public String getBody() {
            return body;
        }

        public void setBody(String body) {
            this.body = body;
        }

        void validate(String languageTag) {
            if (!StringUtils.hasText(body)) {
                throw new IllegalStateException(
                    "mail.verification.localization.messages." + languageTag + ".body must be set"
                );
            }
            if (!body.contains("{{code}}")) {
                throw new IllegalStateException(
                    "mail.verification.localization.messages." + languageTag + ".body must contain {{code}} placeholder"
                );
            }
        }
    }

    /**
     * Rule mapping an IP CIDR range to a language tag.
     */
    public static class Rule {

        private String cidr;
        private String languageTag;

        public String getCidr() {
            return cidr;
        }

        public void setCidr(String cidr) {
            this.cidr = cidr;
        }

        public String getLanguageTag() {
            return languageTag;
        }

        public void setLanguageTag(String languageTag) {
            this.languageTag = languageTag;
        }

        void validate(Map<String, Message> messages) {
            if (!StringUtils.hasText(cidr)) {
                throw new IllegalStateException("mail.verification.localization.rules entries must define cidr");
            }
            if (!StringUtils.hasText(languageTag)) {
                throw new IllegalStateException(
                    "mail.verification.localization.rules entries must define language-tag"
                );
            }
            if (!messages.containsKey(languageTag)) {
                throw new IllegalStateException(
                    "mail.verification.localization.messages must contain language-tag " + languageTag
                );
            }
        }
    }
}
