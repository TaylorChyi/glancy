package com.glancy.backend.service;

import com.glancy.backend.entity.EmailVerificationPurpose;
import java.util.Objects;
import java.util.UUID;
import org.slf4j.MDC;

/**
 * Maintains structured logging context for email verification flows. The context ensures that every
 * log entry in the same thread carries consistent identifiers to aid troubleshooting across layers.
 */
public final class EmailVerificationLogContext implements AutoCloseable {

  private static final String KEY_TRACE_ID = "emailVerificationTraceId";
  private static final String KEY_EMAIL = "emailVerificationEmail";
  private static final String KEY_PURPOSE = "emailVerificationPurpose";

  private EmailVerificationLogContext() {}

  public static EmailVerificationLogContext create(
      String normalizedEmail, EmailVerificationPurpose purpose) {
    String traceId = UUID.randomUUID().toString();
    MDC.put(KEY_TRACE_ID, traceId);
    if (normalizedEmail != null && !normalizedEmail.isBlank()) {
      MDC.put(KEY_EMAIL, normalizedEmail);
    }
    if (Objects.nonNull(purpose)) {
      MDC.put(KEY_PURPOSE, purpose.name());
    }
    return new EmailVerificationLogContext();
  }

  @Override
  public void close() {
    MDC.remove(KEY_TRACE_ID);
    MDC.remove(KEY_EMAIL);
    MDC.remove(KEY_PURPOSE);
  }
}
