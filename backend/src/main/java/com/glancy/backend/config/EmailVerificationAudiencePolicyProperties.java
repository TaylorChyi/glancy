package com.glancy.backend.config;

import java.time.Duration;

public class EmailVerificationAudiencePolicyProperties {

  private Duration inactivityThreshold = Duration.ofDays(365);
  private int softBounceSuppressionThreshold = 3;
  private int hardBounceSuppressionThreshold = 1;

  public Duration getInactivityThreshold() {
    return inactivityThreshold;
  }

  public void setInactivityThreshold(Duration inactivityThreshold) {
    this.inactivityThreshold = inactivityThreshold;
  }

  public int getSoftBounceSuppressionThreshold() {
    return softBounceSuppressionThreshold;
  }

  public void setSoftBounceSuppressionThreshold(int softBounceSuppressionThreshold) {
    this.softBounceSuppressionThreshold = softBounceSuppressionThreshold;
  }

  public int getHardBounceSuppressionThreshold() {
    return hardBounceSuppressionThreshold;
  }

  public void setHardBounceSuppressionThreshold(int hardBounceSuppressionThreshold) {
    this.hardBounceSuppressionThreshold = hardBounceSuppressionThreshold;
  }

  void validate() {
    if (inactivityThreshold == null
        || inactivityThreshold.isZero()
        || inactivityThreshold.isNegative()) {
      throw new IllegalStateException(
          "mail.verification.audience-policy.inactivity-threshold must be positive");
    }
    if (softBounceSuppressionThreshold < 1) {
      throw new IllegalStateException(
          "mail.verification.audience-policy.soft-bounce-suppression-threshold must be >= 1");
    }
    if (hardBounceSuppressionThreshold < 1) {
      throw new IllegalStateException(
          "mail.verification.audience-policy.hard-bounce-suppression-threshold must be >= 1");
    }
  }
}
