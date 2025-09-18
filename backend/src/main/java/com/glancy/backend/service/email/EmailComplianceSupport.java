package com.glancy.backend.service.email;

import com.glancy.backend.config.EmailVerificationProperties;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.util.StringUtils;

/**
 * Shared helper for compliance metadata that multiple email components rely on.
 */
final class EmailComplianceSupport {

    private EmailComplianceSupport() {}

    static Optional<String> buildListUnsubscribeHeader(EmailVerificationProperties properties) {
        EmailVerificationProperties.Compliance compliance = properties.getCompliance();
        List<String> entries = new ArrayList<>();
        if (StringUtils.hasText(compliance.getUnsubscribeMailto())) {
            String address = compliance.getUnsubscribeMailto();
            String mailto = address.startsWith("mailto:") ? address : "mailto:" + address;
            entries.add("<" + mailto + ">");
        }
        if (StringUtils.hasText(compliance.getUnsubscribeUrl())) {
            entries.add("<" + compliance.getUnsubscribeUrl() + ">");
        }
        if (entries.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(String.join(", ", entries));
    }

    static boolean supportsOneClickUnsubscribe(EmailVerificationProperties properties) {
        return StringUtils.hasText(properties.getCompliance().getUnsubscribeUrl());
    }

    static String resolveCompanyName(EmailVerificationProperties properties) {
        String companyName = properties.getCompliance().getCompanyName();
        if (StringUtils.hasText(companyName)) {
            return companyName;
        }
        String mailbox = properties.getFrom();
        if (!StringUtils.hasText(mailbox)) {
            return "Glancy";
        }
        int atIndex = mailbox.indexOf('@');
        if (atIndex > 0 && atIndex < mailbox.length() - 1) {
            String domain = mailbox.substring(atIndex + 1);
            return domain.toUpperCase(Locale.ROOT);
        }
        return mailbox;
    }

    static Optional<String> resolveFromDomain(EmailVerificationProperties properties) {
        String domain = properties.getStreams().getTransactionalDomain();
        if (StringUtils.hasText(domain)) {
            return Optional.of(domain.toLowerCase(Locale.ROOT));
        }
        String from = properties.getFrom();
        if (!StringUtils.hasText(from)) {
            return Optional.empty();
        }
        int atIndex = from.indexOf('@');
        if (atIndex <= 0 || atIndex == from.length() - 1) {
            return Optional.empty();
        }
        return Optional.of(from.substring(atIndex + 1).toLowerCase(Locale.ROOT));
    }

    static Optional<String> buildListIdHeader(EmailVerificationProperties properties, String configuredListId) {
        if (StringUtils.hasText(configuredListId)) {
            return Optional.of(configuredListId.trim());
        }
        Optional<String> domain = resolveFromDomain(properties);
        if (domain.isEmpty()) {
            return Optional.empty();
        }
        String company = resolveCompanyName(properties).replaceAll("\\s+", " ");
        if (!StringUtils.hasText(company)) {
            return Optional.empty();
        }
        return Optional.of(company + " <" + domain.get() + ">");
    }

    static Optional<String> resolveComplaintsContact(EmailVerificationProperties properties, String configuredMailbox) {
        if (StringUtils.hasText(configuredMailbox)) {
            return Optional.of(configuredMailbox.trim());
        }
        EmailVerificationProperties.Compliance compliance = properties.getCompliance();
        if (StringUtils.hasText(compliance.getUnsubscribeMailto())) {
            return Optional.of(compliance.getUnsubscribeMailto().trim());
        }
        if (StringUtils.hasText(compliance.getSupportEmail())) {
            return Optional.of(compliance.getSupportEmail().trim());
        }
        return Optional.empty();
    }
}
