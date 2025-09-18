package com.glancy.backend.service.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.glancy.backend.entity.EmailSuppressionStatus;
import jakarta.mail.MessagingException;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;

class EmailDeliveryFailureClassifierTest {

    /**
     * 验证在遇到 iCloud CS01 退信时，分类器会交由解析器判定为需人工处理的永久失败。
     */
    @Test
    void classifyShouldDelegateToResolverForAppleCodes() {
        EmailDeliveryFailureClassifier classifier = new EmailDeliveryFailureClassifier(
            new MailboxProviderFailureResolver()
        );
        Map<Object, Exception> failures = Map.of(new Object(), new MessagingException("5.7.1 [CS01]"));
        MailSendException exception = mailSendException("smtp error", failures);

        EmailDeliveryFailure failure = classifier.classify(exception);

        assertTrue(failure.permanent());
        assertEquals(EmailSuppressionStatus.MANUAL, failure.suppressionStatus());
        assertEquals("CS01", failure.diagnosticCode());
    }

    /**
     * 验证普通的 SMTP 退信会沿用通用策略并识别为软退信。
     */
    @Test
    void classifyShouldFallbackToGenericStrategy() {
        EmailDeliveryFailureClassifier classifier = new EmailDeliveryFailureClassifier(
            new MailboxProviderFailureResolver()
        );
        Map<Object, Exception> failures = Map.of(new Object(), new MessagingException("451 4.7.0 try again later"));
        MailSendException exception = mailSendException("temporary failure", failures);

        EmailDeliveryFailure failure = classifier.classify(exception);

        assertFalse(failure.permanent());
        assertEquals(EmailSuppressionStatus.SOFT_BOUNCE, failure.suppressionStatus());
        assertEquals("451", failure.diagnosticCode());
    }

    private static MailSendException mailSendException(
        String message,
        Map<Object, Exception> failedMessages
    ) {
        return new MailSendException(message, Map.copyOf(failedMessages));
    }
}
