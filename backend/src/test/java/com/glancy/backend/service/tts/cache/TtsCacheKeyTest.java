package com.glancy.backend.service.tts.cache;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.glancy.backend.entity.TtsScope;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import org.junit.jupiter.api.Test;

/**
 * Verifies the determinism of cache key generation. The algorithm must remain stable so that
 * existing cache entries are reusable.
 */
class TtsCacheKeyTest {

    @Test
    void computeGeneratesSha256OfNormalisedInput() throws Exception {
        String text = "Hello";
        String lang = "en";
        String voice = "v1";
        String format = "mp3";
        double speed = 1.0;
        TtsScope scope = TtsScope.WORD;

        String expectedRaw = String.join(
                "|", text.trim().toLowerCase(Locale.ROOT), lang, voice, format, String.valueOf(speed), scope.name());
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        String expected = HexFormat.of().formatHex(digest.digest(expectedRaw.getBytes(StandardCharsets.UTF_8)));

        assertEquals(expected, TtsCacheKey.compute(text, lang, voice, format, speed, scope));
    }
}
