package com.glancy.backend.util;

import org.springframework.util.StringUtils;

/** Utility methods for masking or previewing sensitive data before logging. */
public final class SensitiveDataUtil {

    private SensitiveDataUtil() {}

    /**
     * Masks a credential-like value by keeping only the last four characters.
     *
     * @param value the original credential
     * @return masked credential retaining last four characters
     */
    public static String maskCredential(String value) {
        if (!StringUtils.hasText(value)) {
            return "****";
        }
        int unmasked = Math.min(4, value.length());
        String maskedPart = "*".repeat(value.length() - unmasked);
        return maskedPart + value.substring(value.length() - unmasked);
    }

    /**
     * Produces a short preview of text, limited to ten characters. Longer text will be truncated and
     * suffixed with ellipsis.
     *
     * @param text original text
     * @return preview of the text
     */
    public static String previewText(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        return text.length() <= 10 ? text : text.substring(0, 10) + "...";
    }
}
