package com.glancy.backend.service.tts.ratelimit;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.glancy.backend.exception.RateLimitExceededException;
import com.glancy.backend.service.tts.config.TtsConfig;
import com.glancy.backend.service.tts.config.TtsConfigManager;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

/** Tests for {@link TtsRateLimiter} ensuring user and IP limits are enforced. */
class TtsRateLimiterTest {

    @Mock
    private TtsConfigManager configManager;

    private Clock clock;
    private TtsRateLimiter limiter;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        clock = Clock.fixed(Instant.parse("2024-01-02T00:00:00Z"), ZoneOffset.UTC);
        TtsConfig cfg = new TtsConfig();
        TtsConfig.RateLimit rl = new TtsConfig.RateLimit();
        rl.setUserPerMinute(2);
        rl.setIpPerMinute(100);
        rl.setBurst(0);
        rl.setCooldownSeconds(60);
        cfg.setRatelimit(rl);
        when(configManager.current()).thenReturn(cfg);
        limiter = new TtsRateLimiter(configManager, clock);
    }

    /**
     * Once the user exceeds the allowed requests per minute, subsequent calls should trigger a {@link
     * RateLimitExceededException}.
     */
    @Test
    void validateEnforcesUserLimit() {
        limiter.validate(1L, "1.1.1.1");
        limiter.validate(1L, "1.1.1.1");
        assertThrows(RateLimitExceededException.class, () -> limiter.validate(1L, "1.1.1.1"));
    }
}
