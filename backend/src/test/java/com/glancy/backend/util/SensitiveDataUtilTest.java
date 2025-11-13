package com.glancy.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

/** Tests for {@link SensitiveDataUtil}. Ensures masking and previewing behave as expected. */
class SensitiveDataUtilTest {

    /**
     * Verifies that maskCredential keeps only the last four characters of the original value to avoid
     * leaking secrets in logs.
     */
    @Test
    void maskCredentialKeepsLastFour() {
        String masked = SensitiveDataUtil.maskCredential("abcdef1234");
        assertEquals("******1234", masked);
    }

    /** Ensures previewText truncates strings longer than ten characters and appends an ellipsis. */
    @Test
    void previewTextTruncatesLongInput() {
        String preview = SensitiveDataUtil.previewText("hello world");
        assertEquals("hello worl...", preview);
    }
}
