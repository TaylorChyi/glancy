package com.glancy.backend.config;

/**
 * Compliance block appended to the verification mail for deliverability and policy clarity.
 */
public class EmailVerificationComplianceProperties {

    private String companyName;
    private String companyAddress;
    private String supportEmail;
    private String website;
    private String unsubscribeUrl;
    private String unsubscribeMailto;

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyAddress() {
        return companyAddress;
    }

    public void setCompanyAddress(String companyAddress) {
        this.companyAddress = companyAddress;
    }

    public String getSupportEmail() {
        return supportEmail;
    }

    public void setSupportEmail(String supportEmail) {
        this.supportEmail = supportEmail;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getUnsubscribeUrl() {
        return unsubscribeUrl;
    }

    public void setUnsubscribeUrl(String unsubscribeUrl) {
        this.unsubscribeUrl = unsubscribeUrl;
    }

    public String getUnsubscribeMailto() {
        return unsubscribeMailto;
    }

    public void setUnsubscribeMailto(String unsubscribeMailto) {
        this.unsubscribeMailto = unsubscribeMailto;
    }
}
