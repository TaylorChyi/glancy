package com.glancy.backend.util;

import org.springframework.util.StringUtils;

/** Utility methods for client configuration normalization. */
public final class ClientUtils {

  private ClientUtils() {}

  /** Removes a trailing slash from the given URL, if present. */
  public static String trimTrailingSlash(String url) {
    if (!StringUtils.hasText(url)) {
      return "";
    }
    return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
  }

  /** Ensures the path starts with a leading slash. */
  public static String ensureLeadingSlash(String path) {
    if (!StringUtils.hasText(path)) {
      return "";
    }
    return path.startsWith("/") ? path : "/" + path;
  }

  /** Masks an API key for safe logging. */
  public static String maskKey(String key) {
    if (!StringUtils.hasText(key) || key.length() <= 8) {
      return "****";
    }
    int end = key.length() - 4;
    return key.substring(0, 4) + "****" + key.substring(end);
  }
}
