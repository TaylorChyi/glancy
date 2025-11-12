package com.glancy.backend.service.support;

import com.glancy.backend.config.OssProperties;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Normalizes avatar references by converting public URLs into bucket object keys. */
@Component
@Slf4j
public class AvatarReferenceResolver {

  private static final Pattern URL_PATTERN =
      Pattern.compile("^https?://.+", Pattern.CASE_INSENSITIVE);

  private final String avatarDir;

  public AvatarReferenceResolver(OssProperties properties) {
    String configuredDir = Optional.ofNullable(properties.getAvatarDir()).orElse("");
    if (configuredDir.startsWith("/")) {
      configuredDir = configuredDir.substring(1);
    }
    this.avatarDir = configuredDir;
  }

  /** Determine whether the provided reference is a fully qualified URL. */
  public boolean isFullUrl(String reference) {
    if (reference == null) {
      return false;
    }
    String trimmed = reference.trim();
    return URL_PATTERN.matcher(trimmed).matches();
  }

  /** Normalize the provided reference into an OSS object key if possible. */
  public Optional<String> normalizeToObjectKey(String reference) {
    if (reference == null) {
      return Optional.empty();
    }
    String trimmed = reference.trim();
    if (trimmed.isEmpty()) {
      return Optional.empty();
    }
    if (!isFullUrl(trimmed)) {
      return Optional.of(normalizeKeyFormat(trimmed));
    }
    return extractObjectKeyFromUrl(trimmed);
  }

  private Optional<String> extractObjectKeyFromUrl(String url) {
    try {
      URI uri = new URI(url);
      String path = uri.getPath();
      if (path == null || path.isBlank()) {
        return Optional.empty();
      }
      String normalizedPath = normalizeKeyFormat(path);
      String decoded = URLDecoder.decode(normalizedPath, StandardCharsets.UTF_8);
      if (decoded.isBlank()) {
        return Optional.empty();
      }
      if (!avatarDir.isBlank() && !decoded.startsWith(avatarDir)) {
        log.warn("Avatar URL {} does not align with configured directory {}", url, avatarDir);
      }
      return Optional.of(decoded);
    } catch (URISyntaxException e) {
      log.warn("Unable to parse avatar URL {}: {}", url, e.getMessage());
      return Optional.empty();
    }
  }

  private String normalizeKeyFormat(String raw) {
    String result = raw;
    if (result.startsWith("/")) {
      result = result.substring(1);
    }
    return result;
  }
}
