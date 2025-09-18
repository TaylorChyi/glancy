package com.glancy.backend.service.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailVerificationPurpose;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Properties;
import org.junit.jupiter.api.Test;

class VerificationEmailComposerTest {

    /**
     * 验证 populate 方法能够组装仅包含验证码正文但仍具备必要传递性邮件头的多格式邮件内容。
     */
    @Test
    void populate_shouldComposeMultipartMessageWithComplianceHeaders() throws Exception {
        EmailVerificationProperties properties = buildProperties();
        VerificationEmailComposer composer = new VerificationEmailComposer(properties);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        LocalDateTime expiresAt = LocalDateTime.of(2024, 1, 1, 12, 0);

        composer.populate(message, "user@example.com", EmailVerificationPurpose.LOGIN, "123456", expiresAt);

        assertEquals("Glancy 登录验证码", message.getSubject());
        assertNotNull(message.getFrom());
        assertTrue(message.getFrom()[0].toString().contains("Glancy 测试"));
        assertTrue(message.getReplyTo()[0].toString().contains("support@test.glancy.xyz"));

        MimeMultipart multipart = (MimeMultipart) message.getContent();
        assertEquals(2, multipart.getCount());
        String plainText = (String) multipart.getBodyPart(0).getContent();
        assertEquals("123456", plainText);

        String html = (String) multipart.getBodyPart(1).getContent();
        assertTrue(html.contains("<p"));
        assertTrue(html.contains("color:#1f2933"));
        assertTrue(html.contains("123456"));
        assertEquals(1, html.split("<p").length - 1);

        String listUnsubscribe = message.getHeader("List-Unsubscribe", null);
        assertNotNull(listUnsubscribe);
        assertTrue(listUnsubscribe.contains("mailto:unsubscribe@test.glancy.xyz"));
        assertTrue(listUnsubscribe.contains("https://test.glancy.xyz/unsubscribe"));

        String feedbackId = message.getHeader("Feedback-ID", null);
        assertNotNull(feedbackId);
        assertTrue(feedbackId.contains("glancy-test:login"));

        String entityRefId = message.getHeader("X-Entity-Ref-ID", null);
        assertNotNull(entityRefId);
        assertTrue(entityRefId.contains("verification-flow-login"));
    }

    private EmailVerificationProperties buildProperties() {
        EmailVerificationProperties properties = new EmailVerificationProperties();
        properties.setFrom("no-reply@test.glancy.xyz");
        properties.setTtl(Duration.ofMinutes(12));
        properties.getSender().setDisplayName("Glancy 测试服务");
        properties.getSender().setReplyTo("support@test.glancy.xyz");
        properties.getCompliance().setCompanyName("Glancy 测试");
        properties.getCompliance().setCompanyAddress("测试市高新大道 1 号");
        properties.getCompliance().setSupportEmail("support@test.glancy.xyz");
        properties.getCompliance().setWebsite("https://test.glancy.xyz");
        properties.getCompliance().setUnsubscribeUrl("https://test.glancy.xyz/unsubscribe");
        properties.getCompliance().setUnsubscribeMailto("unsubscribe@test.glancy.xyz");
        properties.getDeliverability().setFeedbackIdPrefix("glancy-test");
        properties.getDeliverability().setEntityRefIdPrefix("verification-flow");

        EmailVerificationProperties.Template template = new EmailVerificationProperties.Template();
        template.setSubject("Glancy 登录验证码");
        template.setBody("{{code}}");
        EmailVerificationProperties.Template.Rendering rendering = new EmailVerificationProperties.Template.Rendering();
        rendering.setIncludeComplianceBlock(false);
        rendering.setIncludeSecurityNotice(false);
        rendering.setIncludeUnsubscribe(false);
        template.setRendering(rendering);
        properties.getTemplates().put(EmailVerificationPurpose.LOGIN, template);
        return properties;
    }
}
