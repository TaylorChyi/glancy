package com.glancy.backend.service.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.glancy.backend.entity.EmailSuppressionStatus;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class MailboxProviderFailureResolverTest {

    /** 验证当退信诊断包含 iCloud 的 CS01 代码时，解析器能够识别为需人工处理的永久拒收并提供排查建议。 */
    @Test
    void resolveShouldDetectAppleCs01Bounce() {
        MailboxProviderFailureResolver resolver = new MailboxProviderFailureResolver();

        Optional<EmailDeliveryFailure> result = resolver.resolve("5.7.1 [CS01] Message rejected");

        assertTrue(result.isPresent());
        EmailDeliveryFailure failure = result.get();
        assertTrue(failure.permanent());
        assertEquals(EmailSuppressionStatus.MANUAL, failure.suppressionStatus());
        assertEquals("CS01", failure.diagnosticCode());
        assertTrue(failure.description().contains("iCloud 拒收代码 CS01"));
    }

    /** 验证 HM07 代码能够触发同样的人工处理策略，并给出信誉与速率相关的排查提示。 */
    @Test
    void resolveShouldDetectAppleHm07Bounce() {
        MailboxProviderFailureResolver resolver = new MailboxProviderFailureResolver();

        Optional<EmailDeliveryFailure> result = resolver.resolve("Diagnostic: 5.7.1 [HM07] excessive rate");

        assertTrue(result.isPresent());
        EmailDeliveryFailure failure = result.get();
        assertEquals("HM07", failure.diagnosticCode());
        assertTrue(failure.description().contains("HM07"));
    }

    /** 验证在缺少特定提供商代码时解析器保持空结果，不会误判普通退信。 */
    @Test
    void resolveShouldReturnEmptyWhenCodeMissing() {
        MailboxProviderFailureResolver resolver = new MailboxProviderFailureResolver();

        Optional<EmailDeliveryFailure> result = resolver.resolve("421 4.7.0 Temporary failure");

        assertTrue(result.isEmpty());
    }
}
