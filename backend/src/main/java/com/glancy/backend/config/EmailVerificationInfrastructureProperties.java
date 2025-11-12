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
        if (!StringUtils.hasText(reverseDnsDomain)) {
            throw new IllegalStateException("mail.verification.infrastructure.reverse-dns-domain must be configured");
        }
        if (!StringUtils.hasText(spfRecord)) {
            throw new IllegalStateException("mail.verification.infrastructure.spf-record must be configured");
        }
        if (!StringUtils.hasText(dkimSelector)) {
            throw new IllegalStateException("mail.verification.infrastructure.dkim-selector must be configured");
        }
        if (!StringUtils.hasText(dmarcPolicy)) {
            throw new IllegalStateException("mail.verification.infrastructure.dmarc-policy must be configured");
        }
        if (arcSealEnabled) {
            if (!StringUtils.hasText(arcAuthenticationResults)) {
                throw new IllegalStateException(
                    "mail.verification.infrastructure.arc-authentication-results " +
                    "must be configured when arcSealEnabled=true"
                );
            }
            if (!StringUtils.hasText(arcMessageSignature)) {
                throw new IllegalStateException(
                    "mail.verification.infrastructure.arc-message-signature " +
                    "must be configured when arcSealEnabled=true"
                );
            }
            if (!StringUtils.hasText(arcSeal)) {
                throw new IllegalStateException(
                    "mail.verification.infrastructure.arc-seal must be configured when arcSealEnabled=true"
                );
            }
        }
    }
}

