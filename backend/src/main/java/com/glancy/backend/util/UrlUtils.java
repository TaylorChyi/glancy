package com.glancy.backend.util;

/** Utility methods for URL and path normalization. */
public final class UrlUtils {

    private UrlUtils() {}

    /**
     * Removes trailing slash from a URL if present.
     *
     * @param url raw URL
     * @return URL without trailing slash
     */
    public static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /**
     * Ensures the path starts with a leading slash.
     *
     * @param path raw path
     * @return normalized path
     */
    public static String ensureLeadingSlash(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        return path.startsWith("/") ? path : "/" + path;
    }
}
