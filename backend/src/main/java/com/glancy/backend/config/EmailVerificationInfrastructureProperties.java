package com.glancy.backend.config;

import org.springframework.util.StringUtils;

public class EmailVerificationInfrastructureProperties {

    private String reverseDnsDomain;
    private String spfRecord;
    private String dkimSelector;
    private String dmarcPolicy;
    private boolean arcSealEnabled;
    private String arcAuthenticationResults;
    private String arcMessageSignature;
    private String arcSeal;

    public String getReverseDnsDomain() {
        return reverseDnsDomain;
    }

    public void setReverseDnsDomain(String reverseDnsDomain) {
        this.reverseDnsDomain = reverseDnsDomain;
    }

    public String getSpfRecord() {
        return spfRecord;
    }

    public void setSpfRecord(String spfRecord) {
        this.spfRecord = spfRecord;
    }

    public String getDkimSelector() {
        return dkimSelector;
    }

    public void setDkimSelector(String dkimSelector) {
        this.dkimSelector = dkimSelector;
    }

    public String getDmarcPolicy() {
        return dmarcPolicy;
    }

    public void setDmarcPolicy(String dmarcPolicy) {
        this.dmarcPolicy = dmarcPolicy;
    }

    public boolean isArcSealEnabled() {
        return arcSealEnabled;
    }

    public void setArcSealEnabled(boolean arcSealEnabled) {
        this.arcSealEnabled = arcSealEnabled;
    }

    public String getArcAuthenticationResults() {
        return arcAuthenticationResults;
    }

    public void setArcAuthenticationResults(String arcAuthenticationResults) {
        this.arcAuthenticationResults = arcAuthenticationResults;
    }

    public String getArcMessageSignature() {
        return arcMessageSignature;
    }

    public void setArcMessageSignature(String arcMessageSignature) {
        this.arcMessageSignature = arcMessageSignature;
    }

    public String getArcSeal() {
        return arcSeal;
    }

    public void setArcSeal(String arcSeal) {
        this.arcSeal = arcSeal;
    }

    void validate() {
        requireText(reverseDnsDomain, "mail.verification.infrastructure.reverse-dns-domain must be configured");
        requireText(spfRecord, "mail.verification.infrastructure.spf-record must be configured");
        requireText(dkimSelector, "mail.verification.infrastructure.dkim-selector must be configured");
        requireText(dmarcPolicy, "mail.verification.infrastructure.dmarc-policy must be configured");
        if (arcSealEnabled) {
            validateArcChain();
        }
    }

    private void validateArcChain() {
        requireText(
                arcAuthenticationResults,
                "mail.verification.infrastructure.arc-authentication-results must be configured when arcSealEnabled=true");
        requireText(
                arcMessageSignature,
                "mail.verification.infrastructure.arc-message-signature must be configured when arcSealEnabled=true");
        requireText(arcSeal, "mail.verification.infrastructure.arc-seal must be configured when arcSealEnabled=true");
    }

    private void requireText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(message);
        }
    }
}
