package com.glancy.backend.config;

import org.springframework.util.StringUtils;

public class EmailVerificationStreamsProperties {

    private String transactionalDomain;
    private String transactionalIpPool;
    private String marketingDomain;
    private String marketingIpPool;

    public String getTransactionalDomain() {
        return transactionalDomain;
    }

    public void setTransactionalDomain(String transactionalDomain) {
        this.transactionalDomain = transactionalDomain;
    }

    public String getTransactionalIpPool() {
        return transactionalIpPool;
    }

    public void setTransactionalIpPool(String transactionalIpPool) {
        this.transactionalIpPool = transactionalIpPool;
    }

    public String getMarketingDomain() {
        return marketingDomain;
    }

    public void setMarketingDomain(String marketingDomain) {
        this.marketingDomain = marketingDomain;
    }

    public String getMarketingIpPool() {
        return marketingIpPool;
    }

    public void setMarketingIpPool(String marketingIpPool) {
        this.marketingIpPool = marketingIpPool;
    }

    void validate(String from) {
        if (!StringUtils.hasText(transactionalDomain)) {
            throw new IllegalStateException("mail.verification.streams.transactional-domain must be configured");
        }
        if (StringUtils.hasText(marketingDomain) && marketingDomain.equalsIgnoreCase(transactionalDomain)) {
            throw new IllegalStateException(
                    "mail.verification.streams.marketing-domain must differ from transactional-domain "
                            + "for proper segmentation");
        }
        if (StringUtils.hasText(from)) {
            int atIndex = from.indexOf('@');
            if (atIndex > 0 && atIndex < from.length() - 1) {
                String fromDomain = from.substring(atIndex + 1);
                if (!fromDomain.equalsIgnoreCase(transactionalDomain)) {
                    throw new IllegalStateException(
                            "mail.verification.from domain must match mail.verification.streams.transactional-domain");
                }
            }
        }
    }
}
