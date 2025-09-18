package com.glancy.backend.service.email;

import static org.assertj.core.api.Assertions.assertThat;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailStream;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MailboxProviderPolicyEngineTest {

    private MailboxProviderPolicyEngine policyEngine;
    private EmailVerificationProperties properties;

    @BeforeEach
    void setUp() {
        properties = new EmailVerificationProperties();
        properties.setFrom("no-reply@mail.glancy.xyz");
        properties.getStreams().setTransactionalDomain("mail.glancy.xyz");
        properties.getCompliance().setCompanyName("Glancy Tech");
        properties.getCompliance().setSupportEmail("support@mail.glancy.xyz");
        properties.getCompliance().setUnsubscribeMailto("unsubscribe@mail.glancy.xyz");
        properties.getCompliance().setUnsubscribeUrl("https://www.glancy.xyz/email/unsubscribe");
        properties.getDeliverability().setFeedbackIdPrefix("glancy-txn");

        EmailVerificationProperties.Deliverability.MailboxProviderPolicy icloudPolicy =
            new EmailVerificationProperties.Deliverability.MailboxProviderPolicy();
        icloudPolicy.setDomains(List.of("icloud.com", "me.com", "mac.com"));
        icloudPolicy.setListId("Glancy 事务通知 <mail.glancy.xyz>");
        icloudPolicy.setComplaintsMailto("abuse@mail.glancy.xyz");
        properties.getDeliverability().setMailboxProviderPolicies(Map.of("icloud", icloudPolicy));

        policyEngine = new MailboxProviderPolicyEngine(properties);
    }

    @Test
    /**
     * 测试逻辑：构造 iCloud 邮箱收件人，执行策略引擎以补齐 Apple 要求的头部字段，验证
     * List-Unsubscribe、List-ID、反馈与投诉头均正确生成。
     */
    void shouldApplyIcloudComplianceHeaders() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));

        policyEngine.apply(message, EmailStream.TRANSACTIONAL, "member@icloud.com");

        assertThat(message.getHeader("List-Unsubscribe", null)).isEqualTo(
            "<mailto:unsubscribe@mail.glancy.xyz>, <https://www.glancy.xyz/email/unsubscribe>"
        );
        assertThat(message.getHeader("List-Unsubscribe-Post", null)).isEqualTo("List-Unsubscribe=One-Click");
        assertThat(message.getHeader("List-ID", null)).isEqualTo("Glancy 事务通知 <mail.glancy.xyz>");
        assertThat(message.getHeader("X-Complaints-To", null)).isEqualTo("mailto:abuse@mail.glancy.xyz");
        assertThat(message.getHeader("X-Report-Abuse", null)).isEqualTo("mailto:abuse@mail.glancy.xyz");
        assertThat(message.getHeader("Feedback-ID", null)).isEqualTo("glancy-txn:transactional:glancy-tech");
    }
}
