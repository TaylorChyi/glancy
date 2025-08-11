package com.glancy.backend.service.tts.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Tests for {@link TtsConfigManager} focused on reload behaviour and validation
 * mechanics.
 */
class TtsConfigManagerTest {

    @TempDir
    Path tempDir;

    /**
     * A valid YAML file should replace the in-memory snapshot when reloaded.
     * Flow: write initial config -> load -> modify -> reload -> verify update.
     */
    @Test
    void reloadReplacesSnapshotOnValidConfig() throws IOException {
        Path file = tempDir.resolve("tts.yml");
        Files.writeString(
            file,
            """
            voices:
              zh-CN:
                default: zh_female_cancan_mars_bigtts
                options:
                  - id: zh_female_cancan_mars_bigtts
                    label: A
                    plan: all
            quota:
              daily: { pro: 100, free: 5 }
            cache:
              ttlDays: { pro: 90, free: 30 }
              audioSampleRate: 48000
            ratelimit:
              userPerMinute: 30
              ipPerMinute: 120
              burst: 20
              cooldownSeconds: 60
            features:
              hotReload: false
              useCdn: true
              returnUrl: true
              countCachedAsUsage: false
            """
        );
        TtsConfigManager mgr = new TtsConfigManager(file.toString());
        mgr.reload();
        assertEquals("zh_female_cancan_mars_bigtts", mgr.current().getVoices().get("zh-CN").getDefaultVoice());

        Files.writeString(
            file,
            """
            voices:
              zh-CN:
                default: zh_male_new_voice
                options:
                  - id: zh_male_new_voice
                    label: B
                    plan: all
            quota:
              daily: { pro: 100, free: 5 }
            cache:
              ttlDays: { pro: 90, free: 30 }
              audioSampleRate: 48000
            ratelimit:
              userPerMinute: 30
              ipPerMinute: 120
              burst: 20
              cooldownSeconds: 60
            features:
              hotReload: false
              useCdn: true
              returnUrl: true
              countCachedAsUsage: false
            """
        );
        mgr.reload();
        assertEquals("zh_male_new_voice", mgr.current().getVoices().get("zh-CN").getDefaultVoice());
        mgr.close();
    }

    /**
     * When the configuration is invalid the previous snapshot should remain
     * active. Flow: load valid config -> write invalid -> reload -> unchanged.
     */
    @Test
    void reloadRejectsInvalidConfig() throws IOException {
        Path file = tempDir.resolve("tts.yml");
        Files.writeString(
            file,
            """
            voices:
              zh-CN:
                default: voice1
                options:
                  - id: voice1
                    label: A
                    plan: all
            quota:
              daily: { pro: 100, free: 5 }
            cache:
              ttlDays: { pro: 90, free: 30 }
              audioSampleRate: 48000
            ratelimit:
              userPerMinute: 30
              ipPerMinute: 120
              burst: 20
              cooldownSeconds: 60
            features:
              hotReload: false
              useCdn: true
              returnUrl: true
              countCachedAsUsage: false
            """
        );
        TtsConfigManager mgr = new TtsConfigManager(file.toString());
        mgr.reload();
        assertEquals("voice1", mgr.current().getVoices().get("zh-CN").getDefaultVoice());

        Files.writeString(
            file,
            """
            voices:
              zh-CN:
                default: missing
                options:
                  - id: voice1
                    label: A
                    plan: all
            quota:
              daily: { pro: 100, free: 5 }
            cache:
              ttlDays: { pro: 90, free: 30 }
              audioSampleRate: 48000
            ratelimit:
              userPerMinute: 30
              ipPerMinute: 120
              burst: 20
              cooldownSeconds: 60
            features:
              hotReload: false
              useCdn: true
              returnUrl: true
              countCachedAsUsage: false
            """
        );
        mgr.reload();
        assertEquals(
            "voice1",
            mgr.current().getVoices().get("zh-CN").getDefaultVoice(),
            "Invalid config should not replace snapshot"
        );
        mgr.close();
    }
}
