package com.glancy.backend.service.tts.cache;

import com.glancy.backend.entity.TtsScope;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Utility for computing cache keys used to deduplicate synthesis requests. The hash is stable
 * across environments so that existing cache entries remain reusable over time.
 */
public final class TtsCacheKey {

  private TtsCacheKey() {}

  /** Generate a SHA-256 hash over the normalised synthesis parameters. */
  public static String compute(
      String text, String lang, String voice, String format, double speed, TtsScope scope) {
    String normalised = text == null ? "" : text.trim().toLowerCase(Locale.ROOT);
    String raw =
        String.join("|", normalised, lang, voice, format, String.valueOf(speed), scope.name());
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 not available", ex);
    }
  }
}
