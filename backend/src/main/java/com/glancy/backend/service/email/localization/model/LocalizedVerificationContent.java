package com.glancy.backend.service.email.localization.model;

import java.util.Objects;

public record LocalizedVerificationContent(String plainText, String htmlBody) {
  public LocalizedVerificationContent {
    Objects.requireNonNull(plainText, "plainText");
    Objects.requireNonNull(htmlBody, "htmlBody");
  }
}
