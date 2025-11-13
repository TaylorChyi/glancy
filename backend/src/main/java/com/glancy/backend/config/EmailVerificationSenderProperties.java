package com.glancy.backend.config;

/** Sender customization that augments the bare mailbox address. */
public class EmailVerificationSenderProperties {

    private String displayName;
    private String replyTo;

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getReplyTo() {
        return replyTo;
    }

    public void setReplyTo(String replyTo) {
        this.replyTo = replyTo;
    }
}
