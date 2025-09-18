package com.glancy.backend.service.email;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Generates RFC compliant {@code Message-ID} values bound to a specific domain to
 * improve deliverability reputation.
 */
@Component
public class MessageIdGenerator {

    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter
        .ofPattern("yyyyMMddHHmmssSSS", Locale.ROOT)
        .withZone(ZoneOffset.UTC);

    private final Clock clock;

    public MessageIdGenerator(Clock clock) {
        this.clock = clock;
    }

    public String generate(String domain) {
        String sanitizedDomain = sanitizeDomain(domain);
        if (!StringUtils.hasText(sanitizedDomain)) {
            throw new IllegalArgumentException("Domain must not be blank when generating Message-ID");
        }
        Instant now = clock.instant();
        String timestampComponent = TIMESTAMP_FORMATTER.format(now);
        String randomComponent = UUID.randomUUID().toString().replace("-", "");
        return "<" + timestampComponent + "." + randomComponent + "@" + sanitizedDomain + ">";
    }

    private String sanitizeDomain(String domain) {
        if (!StringUtils.hasText(domain)) {
            return null;
        }
        String trimmed = domain.trim().toLowerCase(Locale.ROOT);
        StringBuilder builder = new StringBuilder(trimmed.length());
        for (char ch : trimmed.toCharArray()) {
            if (Character.isLetterOrDigit(ch) || ch == '-' || ch == '.') {
                builder.append(ch);
            }
        }
        String sanitized = builder.toString();
        if (sanitized.startsWith(".")) {
            sanitized = sanitized.substring(1);
        }
        if (sanitized.endsWith(".")) {
            sanitized = sanitized.substring(0, sanitized.length() - 1);
        }
        return sanitized;
    }
}
