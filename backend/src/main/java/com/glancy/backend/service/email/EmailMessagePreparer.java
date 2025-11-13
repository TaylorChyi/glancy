package com.glancy.backend.service.email;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailStream;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** Applies provider-agnostic metadata on outbound messages prior to SMTP submission. */
@Component
public class EmailMessagePreparer {

    private final EmailVerificationProperties properties;
    private final MessageIdGenerator messageIdGenerator;

    public EmailMessagePreparer(EmailVerificationProperties properties, MessageIdGenerator messageIdGenerator) {
        this.properties = properties;
        this.messageIdGenerator = messageIdGenerator;
    }

    public void prepare(MimeMessage message, EmailStream stream) throws MessagingException {
        if (stream == EmailStream.TRANSACTIONAL) {
            ensureMessageId(message, resolveTransactionalDomain());
        }
    }

    private void ensureMessageId(MimeMessage message, String domain) throws MessagingException {
        if (!StringUtils.hasText(domain)) {
            return;
        }
        String existing = message.getHeader("Message-ID", null);
        if (StringUtils.hasText(existing)) {
            return;
        }
        String messageId = messageIdGenerator.generate(domain);
        message.setHeader("Message-ID", messageId);
    }

    private String resolveTransactionalDomain() {
        String domain = properties.getStreams().getTransactionalDomain();
        if (StringUtils.hasText(domain)) {
            return domain;
        }
        String from = properties.getFrom();
        if (!StringUtils.hasText(from)) {
            return null;
        }
        int atIndex = from.indexOf('@');
        if (atIndex <= 0 || atIndex == from.length() - 1) {
            return null;
        }
        return from.substring(atIndex + 1).toLowerCase(Locale.ROOT);
    }
}
