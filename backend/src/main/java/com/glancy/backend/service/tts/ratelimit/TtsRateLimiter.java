package com.glancy.backend.service.tts.ratelimit;

import com.glancy.backend.exception.RateLimitExceededException;
import com.glancy.backend.service.tts.config.TtsConfig;
import com.glancy.backend.service.tts.config.TtsConfigManager;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * In-memory token bucket rate limiter for TTS requests. Suitable for single-node deployments;
 * external implementations should be provided for distributed environments.
 */
@Component
@Slf4j
public class TtsRateLimiter {

    private static class Bucket {

        int tokens;
        long windowStart;
        long cooldownUntil;
    }

    private final Map<String, Bucket> userBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    private final TtsConfigManager configManager;
    private final Clock clock;

    public TtsRateLimiter(TtsConfigManager configManager, Clock clock) {
        this.configManager = configManager;
        this.clock = clock;
    }

    /** Validate request against user and IP limits. */
    public void validate(Long userId, String ip) {
        TtsConfig.RateLimit cfg = configManager.current().getRatelimit();
        long retryUser = checkBucket(
                userBuckets, userId.toString(), cfg.getUserPerMinute(), cfg.getBurst(), cfg.getCooldownSeconds());
        if (retryUser > 0) {
            log.warn("User {} hit rate limit, retry after {}s", userId, retryUser);
            throw new RateLimitExceededException("请" + retryUser + "秒后重试");
        }
        long retryIp = checkBucket(ipBuckets, ip, cfg.getIpPerMinute(), cfg.getBurst(), cfg.getCooldownSeconds());
        if (retryIp > 0) {
            log.warn("IP {} hit rate limit, retry after {}s", maskIp(ip), retryIp);
            throw new RateLimitExceededException("请" + retryIp + "秒后重试");
        }
    }

    private long checkBucket(Map<String, Bucket> buckets, String key, int perMinute, int burst, int cooldownSeconds) {
        long now = clock.millis();
        Bucket bucket = buckets.computeIfAbsent(key, k -> {
            Bucket b = new Bucket();
            b.tokens = perMinute + burst;
            b.windowStart = now;
            return b;
        });
        synchronized (bucket) {
            if (now < bucket.cooldownUntil) {
                return (bucket.cooldownUntil - now + 999) / 1000;
            }
            if (now - bucket.windowStart >= 60_000) {
                bucket.tokens = perMinute + burst;
                bucket.windowStart = now;
            }
            if (bucket.tokens > 0) {
                bucket.tokens--;
                return 0;
            }
            bucket.cooldownUntil = now + cooldownSeconds * 1000L;
            return (bucket.cooldownUntil - now + 999) / 1000;
        }
    }

    private String maskIp(String ip) {
        int idx = ip.lastIndexOf('.');
        return idx > 0 ? ip.substring(0, idx) + ".xxx" : ip;
    }
}
