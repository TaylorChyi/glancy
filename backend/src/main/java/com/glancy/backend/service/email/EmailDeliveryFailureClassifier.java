package com.glancy.backend.service.email;

import com.glancy.backend.entity.EmailSuppressionStatus;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.stereotype.Component;

/**
 * Translates {@link MailException} instances into structured failure records for downstream policies.
 */
@Component
public class EmailDeliveryFailureClassifier {

    private static final Pattern SMTP_STATUS_PATTERN = Pattern.compile("\\b([245]\\d{2})\\b");

    public EmailDeliveryFailure classify(MailException exception) {
        if (exception instanceof MailAuthenticationException authException) {
            return new EmailDeliveryFailure(
                true,
                EmailSuppressionStatus.MANUAL,
                "AUTH",
                safeMessage(authException)
            );
        }
        if (exception instanceof MailSendException sendException) {
            return extractFromMailSendException(sendException);
        }
        return new EmailDeliveryFailure(false, EmailSuppressionStatus.SOFT_BOUNCE, null, safeMessage(exception));
    }

    private EmailDeliveryFailure extractFromMailSendException(MailSendException sendException) {
        Optional<Exception> nested = sendException
            .getFailedMessages()
            .values()
            .stream()
            .findFirst();
        String diagnostic = nested.map(this::safeMessage).orElseGet(() -> safeMessage(sendException));
        boolean permanent = isPermanentFailure(diagnostic);
        EmailSuppressionStatus status = permanent ? EmailSuppressionStatus.HARD_BOUNCE : EmailSuppressionStatus.SOFT_BOUNCE;
        String smtpCode = extractSmtpCode(diagnostic);
        return new EmailDeliveryFailure(permanent, status, smtpCode, diagnostic);
    }

    private boolean isPermanentFailure(String diagnostic) {
        String lowercase = diagnostic == null ? "" : diagnostic.toLowerCase(Locale.ROOT);
        if (lowercase.contains("mailbox full") || lowercase.contains("temporary") || lowercase.contains("try again")) {
            return false;
        }
        if (lowercase.contains("denied") || lowercase.contains("blocked") || lowercase.contains("rejected")) {
            return true;
        }
        String code = extractSmtpCode(diagnostic);
        if (code == null) {
            return false;
        }
        return code.startsWith("5");
    }

    private String extractSmtpCode(String diagnostic) {
        if (diagnostic == null) {
            return null;
        }
        Matcher matcher = SMTP_STATUS_PATTERN.matcher(diagnostic);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String safeMessage(Exception exception) {
        return Optional.ofNullable(exception.getMessage()).orElse(exception.getClass().getSimpleName());
    }
}
