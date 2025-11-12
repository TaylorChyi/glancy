package com.glancy.backend.service.email;

import com.glancy.backend.config.EmailVerificationProperties;
import org.springframework.stereotype.Component;

/**
 * Aggregates reusable collaborators required for outbound email assembly so that caller constructors
 * stay within style limits.
 */
@Component
public class EmailOutboundToolkit {

    private final EmailVerificationProperties properties;
    private final EmailMessagePreparer messagePreparer;
    private final MailboxProviderPolicyEngine mailboxProviderPolicyEngine;

    public EmailOutboundToolkit(
        EmailVerificationProperties properties,
        EmailMessagePreparer messagePreparer,
        MailboxProviderPolicyEngine mailboxProviderPolicyEngine
    ) {
        this.properties = properties;
        this.messagePreparer = messagePreparer;
        this.mailboxProviderPolicyEngine = mailboxProviderPolicyEngine;
    }

    public EmailVerificationProperties properties() {
        return properties;
    }

    public EmailMessagePreparer messagePreparer() {
        return messagePreparer;
    }

    public MailboxProviderPolicyEngine mailboxProviderPolicyEngine() {
        return mailboxProviderPolicyEngine;
    }
}
