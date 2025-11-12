package com.glancy.backend.service.email;

import com.glancy.backend.config.EmailVerificationDeliverabilityProperties;
import com.glancy.backend.config.EmailVerificationDeliverabilityProperties.MailboxProviderPolicy;
import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailStream;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** Applies mailbox provider specific compliance policy before handing off to SMTP. */
@Component
public class MailboxProviderPolicyEngine {

  private final EmailVerificationProperties properties;

  public MailboxProviderPolicyEngine(EmailVerificationProperties properties) {
    this.properties = properties;
  }

  public void apply(MimeMessage message, EmailStream stream, String recipient)
      throws MessagingException {
    if (!StringUtils.hasText(recipient)) {
      return;
    }
    String domain = extractDomain(recipient);
    if (!StringUtils.hasText(domain)) {
      return;
    }
    EmailVerificationDeliverabilityProperties deliverability = properties.getDeliverability();
    if (deliverability == null) {
      return;
    }
    for (MailboxProviderPolicy policy : deliverability.getMailboxProviderPolicies().values()) {
      if (policy.appliesTo(domain)) {
        applyPolicy(message, policy, stream);
      }
    }
  }

  private String extractDomain(String email) {
    int atIndex = email.lastIndexOf('@');
    if (atIndex <= 0 || atIndex == email.length() - 1) {
      return null;
    }
    return email.substring(atIndex + 1).toLowerCase(Locale.ROOT);
  }

  private void applyPolicy(MimeMessage message, MailboxProviderPolicy policy, EmailStream stream)
      throws MessagingException {
    ensureListUnsubscribe(message, policy);
    ensureFeedbackId(message, stream);
    ensureListId(message, policy);
    applyComplaintContacts(message, policy);
  }

  private void ensureListUnsubscribe(MimeMessage message, MailboxProviderPolicy policy)
      throws MessagingException {
    if (!policy.isEnforceListUnsubscribe()) {
      return;
    }
    String existing = message.getHeader("List-Unsubscribe", null);
    if (StringUtils.hasText(existing)) {
      return;
    }
    Optional<String> fallback = EmailComplianceSupport.buildListUnsubscribeHeader(properties);
    if (fallback.isEmpty()) {
      throw new MessagingException("缺失退订配置，无法满足邮箱服务商政策要求");
    }
    message.setHeader("List-Unsubscribe", fallback.get());
    if (EmailComplianceSupport.supportsOneClickUnsubscribe(properties)) {
      message.setHeader("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
    }
  }

  private void ensureFeedbackId(MimeMessage message, EmailStream stream) throws MessagingException {
    String existing = message.getHeader("Feedback-ID", null);
    if (StringUtils.hasText(existing)) {
      return;
    }
    String feedbackIdPrefix = properties.getDeliverability().getFeedbackIdPrefix();
    if (!StringUtils.hasText(feedbackIdPrefix)) {
      return;
    }
    String companySlug =
        EmailComplianceSupport.resolveCompanyName(properties)
            .replaceAll("\\s+", "-")
            .toLowerCase(Locale.ROOT);
    String feedbackId =
        feedbackIdPrefix + ":" + stream.name().toLowerCase(Locale.ROOT) + ":" + companySlug;
    message.setHeader("Feedback-ID", feedbackId);
  }

  private void ensureListId(MimeMessage message, MailboxProviderPolicy policy)
      throws MessagingException {
    if (StringUtils.hasText(message.getHeader("List-ID", null))) {
      return;
    }
    Optional<String> listId =
        EmailComplianceSupport.buildListIdHeader(properties, policy.getListId());
    if (listId.isEmpty()) {
      return;
    }
    message.setHeader("List-ID", listId.get());
  }

  private void applyComplaintContacts(MimeMessage message, MailboxProviderPolicy policy)
      throws MessagingException {
    Optional<String> mailbox =
        EmailComplianceSupport.resolveComplaintsContact(properties, policy.getComplaintsMailto());
    if (mailbox.isEmpty()) {
      return;
    }
    String formatted = formatMailto(mailbox.get());
    message.setHeader("X-Complaints-To", formatted);
    message.setHeader("X-Report-Abuse", formatted);
  }

  private String formatMailto(String value) {
    String trimmed = value.trim();
    if (trimmed.regionMatches(true, 0, "mailto:", 0, "mailto:".length())) {
      return trimmed;
    }
    return "mailto:" + trimmed;
  }
}
