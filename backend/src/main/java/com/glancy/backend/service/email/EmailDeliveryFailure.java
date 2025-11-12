package com.glancy.backend.service.email;

import com.glancy.backend.entity.EmailSuppressionStatus;
import java.util.Objects;

/** Represents a classified SMTP failure returned by the outbound mail server. */
public record EmailDeliveryFailure(
    boolean permanent,
    EmailSuppressionStatus suppressionStatus,
    String diagnosticCode,
    String description) {
  public EmailDeliveryFailure {
    suppressionStatus = Objects.requireNonNullElse(suppressionStatus, EmailSuppressionStatus.NONE);
  }

  public boolean shouldSuppress() {
    return suppressionStatus.isSuppressed();
  }
}
