package com.glancy.backend.service.email;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailVerificationPurpose;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

/**
 * Composes verification email content with compliance headers to improve deliverability.
 */
@Component
public class VerificationEmailComposer {

    private static final DateTimeFormatter EXPIRES_AT_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm", Locale.SIMPLIFIED_CHINESE);

    private final EmailVerificationProperties properties;

    public VerificationEmailComposer(EmailVerificationProperties properties) {
        this.properties = properties;
    }

    public void populate(
        MimeMessage message,
        String recipient,
        EmailVerificationPurpose purpose,
        String code,
        LocalDateTime expiresAt
    ) throws MessagingException {
        EmailVerificationProperties.Template template = resolveTemplate(purpose);
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
        helper.setTo(recipient);
        helper.setSubject(template.getSubject());
        helper.setSentDate(new Date());
        setSender(helper);
        setReplyTo(helper);

        RenderedContent renderedContent = renderContent(template.getBody(), code, expiresAt);
        helper.setText(renderedContent.plainText(), renderedContent.htmlBody());
        helper.setPriority(1);

        applyComplianceHeaders(message, purpose);
    }

    private EmailVerificationProperties.Template resolveTemplate(EmailVerificationPurpose purpose) {
        EmailVerificationProperties.Template template = properties.getTemplates().get(purpose);
        if (template == null) {
            throw new IllegalStateException("Missing email template configuration for purpose " + purpose);
        }
        return template;
    }

    private void setSender(MimeMessageHelper helper) throws MessagingException {
        String mailbox = properties.getFrom();
        String displayName = properties.getSender().getDisplayName();
        if (!StringUtils.hasText(displayName)) {
            displayName = properties.getCompliance().getCompanyName();
        }
        if (StringUtils.hasText(displayName)) {
            try {
                helper.setFrom(new InternetAddress(mailbox, displayName, StandardCharsets.UTF_8.name()));
                return;
            } catch (UnsupportedEncodingException ex) {
                throw new MessagingException("Unable to encode sender personal name", ex);
            }
        }
        helper.setFrom(mailbox);
    }

    private void setReplyTo(MimeMessageHelper helper) throws MessagingException {
        String replyTo = properties.getSender().getReplyTo();
        if (StringUtils.hasText(replyTo)) {
            helper.setReplyTo(replyTo);
        }
    }

    private RenderedContent renderContent(String templateBody, String code, LocalDateTime expiresAt) {
        Map<String, String> tokens = new LinkedHashMap<>();
        tokens.put("{{code}}", code);
        tokens.put("{{ttlMinutes}}", String.valueOf(properties.getTtl().toMinutes()));
        tokens.put("{{expiresAt}}", EXPIRES_AT_FORMATTER.format(expiresAt));
        tokens.put("{{companyName}}", resolveCompanyName());
        String supportEmail = properties.getCompliance().getSupportEmail();
        if (StringUtils.hasText(supportEmail)) {
            tokens.put("{{supportEmail}}", supportEmail);
        }
        String resolved = applyTokens(templateBody, tokens);

        List<String> paragraphs = new ArrayList<>();
        paragraphs.add(resolved.trim());
        paragraphs.add(buildSecurityNotice());

        String complianceBlock = buildComplianceBlock();
        if (StringUtils.hasText(complianceBlock)) {
            paragraphs.add(complianceBlock);
        }
        String unsubscribeParagraph = buildUnsubscribeParagraph();
        if (StringUtils.hasText(unsubscribeParagraph)) {
            paragraphs.add(unsubscribeParagraph);
        }

        String plainText = String.join("\n\n", paragraphs);
        String htmlBody = paragraphs.stream().map(this::toHtmlParagraph).reduce("", String::concat);
        return new RenderedContent(plainText, htmlBody);
    }

    private String applyTokens(String templateBody, Map<String, String> tokens) {
        String resolved = templateBody;
        for (Map.Entry<String, String> entry : tokens.entrySet()) {
            if (entry.getValue() != null) {
                resolved = resolved.replace(entry.getKey(), entry.getValue());
            }
        }
        return resolved;
    }

    private String buildSecurityNotice() {
        StringBuilder builder = new StringBuilder();
        builder.append("若您并未发起该请求，请忽略本邮件或立即联系我们的客服团队，以免账号被盗用。");
        String supportEmail = properties.getCompliance().getSupportEmail();
        if (StringUtils.hasText(supportEmail)) {
            builder
                .append(" 如需帮助，请联系：")
                .append(supportEmail);
        }
        return builder.toString();
    }

    private String buildComplianceBlock() {
        List<String> lines = new ArrayList<>();
        lines.add(resolveCompanyName());
        String address = properties.getCompliance().getCompanyAddress();
        if (StringUtils.hasText(address)) {
            lines.add(address);
        }
        List<String> contactSegments = new ArrayList<>();
        String website = properties.getCompliance().getWebsite();
        if (StringUtils.hasText(website)) {
            contactSegments.add("官网：" + website);
        }
        String supportEmail = properties.getCompliance().getSupportEmail();
        if (StringUtils.hasText(supportEmail)) {
            contactSegments.add("客服邮箱：" + supportEmail);
        }
        if (!contactSegments.isEmpty()) {
            lines.add(String.join(" | ", contactSegments));
        }
        lines.removeIf(segment -> !StringUtils.hasText(segment));
        if (lines.isEmpty()) {
            return "";
        }
        return String.join("\n", lines);
    }

    private String buildUnsubscribeParagraph() {
        String unsubscribeUrl = properties.getCompliance().getUnsubscribeUrl();
        String unsubscribeMailto = properties.getCompliance().getUnsubscribeMailto();
        if (!StringUtils.hasText(unsubscribeUrl) && !StringUtils.hasText(unsubscribeMailto)) {
            return "";
        }
        List<String> channels = new ArrayList<>();
        if (StringUtils.hasText(unsubscribeUrl)) {
            channels.add("在线退订：" + unsubscribeUrl);
        }
        if (StringUtils.hasText(unsubscribeMailto)) {
            channels.add("邮件退订：" + unsubscribeMailto);
        }
        return "如需停止接收此类通知，可通过以下方式退订：" + String.join("；", channels);
    }

    private void applyComplianceHeaders(MimeMessage message, EmailVerificationPurpose purpose) throws MessagingException {
        message.setSentDate(new Date());
        message.setHeader("Auto-Submitted", "auto-generated");
        message.setHeader("X-Auto-Response-Suppress", "All");

        String listUnsubscribe = buildListUnsubscribeHeader();
        if (StringUtils.hasText(listUnsubscribe)) {
            message.setHeader("List-Unsubscribe", listUnsubscribe);
            if (properties.getCompliance().getUnsubscribeUrl() != null) {
                message.setHeader("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
            }
        }

        String feedbackIdPrefix = properties.getDeliverability().getFeedbackIdPrefix();
        if (StringUtils.hasText(feedbackIdPrefix)) {
            String companySlug = resolveCompanyName().replaceAll("\\s+", "-").toLowerCase(Locale.ROOT);
            String feedbackId =
                feedbackIdPrefix + ":" + purpose.name().toLowerCase(Locale.ROOT) + ":" + companySlug;
            message.setHeader("Feedback-ID", feedbackId);
        }

        String entityRefIdPrefix = properties.getDeliverability().getEntityRefIdPrefix();
        if (StringUtils.hasText(entityRefIdPrefix)) {
            message.setHeader(
                "X-Entity-Ref-ID",
                entityRefIdPrefix + "-" + purpose.name().toLowerCase(Locale.ROOT)
            );
        }
    }

    private String buildListUnsubscribeHeader() {
        List<String> entries = new ArrayList<>();
        String unsubscribeMailto = properties.getCompliance().getUnsubscribeMailto();
        if (StringUtils.hasText(unsubscribeMailto)) {
            String address = unsubscribeMailto.startsWith("mailto:")
                ? unsubscribeMailto
                : "mailto:" + unsubscribeMailto;
            entries.add("<" + address + ">");
        }
        String unsubscribeUrl = properties.getCompliance().getUnsubscribeUrl();
        if (StringUtils.hasText(unsubscribeUrl)) {
            entries.add("<" + unsubscribeUrl + ">");
        }
        return entries.isEmpty() ? "" : String.join(", ", entries);
    }

    private String toHtmlParagraph(String paragraph) {
        String escaped = HtmlUtils.htmlEscape(paragraph.trim());
        String content = escaped.replace("\n", "<br/>");
        return "<p style=\"margin:0 0 16px; font-size:14px; line-height:1.6; color:#1f2933;\">" + content + "</p>";
    }

    private String resolveCompanyName() {
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

    private record RenderedContent(String plainText, String htmlBody) {
        private RenderedContent {
            Objects.requireNonNull(plainText, "plainText");
            Objects.requireNonNull(htmlBody, "htmlBody");
        }
    }
}
