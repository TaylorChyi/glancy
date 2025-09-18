package com.glancy.backend.service.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailStream;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Properties;
import org.junit.jupiter.api.Test;

class MailboxProviderPolicyEngineTest {

    /**
     * 验证在目标邮箱域命中策略时，策略引擎能够为消息补齐苹果生态要求的关键信息头，
     * 包括退订、投诉反馈与品牌识别标识，确保 iCloud 投递符合规范。
     */
    @Test
    void apply_shouldEnrichMessageForIcloudRecipients() throws Exception {
        EmailVerificationProperties properties = new EmailVerificationProperties();
        properties.setFrom("no-reply@mail.glancy.xyz");
        properties.getStreams().setTransactionalDomain("mail.glancy.xyz");
        properties.getCompliance().setCompanyName("Glancy Test");
        properties.getCompliance().setSupportEmail("support@glancy.xyz");
        properties.getCompliance().setUnsubscribeMailto("unsubscribe@glancy.xyz");
        properties.getCompliance().setUnsubscribeUrl("https://glancy.xyz/unsubscribe");
        properties.getDeliverability().setFeedbackIdPrefix("glancy-test");

        EmailVerificationProperties.Deliverability.MailboxProviderPolicy policy =
            new EmailVerificationProperties.Deliverability.MailboxProviderPolicy();
        policy.setDomains(List.of("icloud.com", "me.com"));
        policy.setComplaintsMailto("complaints@glancy.xyz");
        properties.getDeliverability().getMailboxProviderPolicies().put("icloud", policy);

        MailboxProviderPolicyEngine engine = new MailboxProviderPolicyEngine(properties);

        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        engine.apply(message, EmailStream.TRANSACTIONAL, "user@icloud.com");

        assertNotNull(message.getHeader("List-Unsubscribe", null));
        assertEquals("List-Unsubscribe=One-Click", message.getHeader("List-Unsubscribe-Post", null));
        assertEquals("glancy-test:transactional:glancy-test", message.getHeader("Feedback-ID", null));
        assertEquals("Glancy Test <mail.glancy.xyz>", message.getHeader("List-ID", null));
        assertEquals("mailto:complaints@glancy.xyz", message.getHeader("X-Complaints-To", null));
        assertEquals("mailto:complaints@glancy.xyz", message.getHeader("X-Report-Abuse", null));
    }
}
