package com.glancy.backend.service.tts.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import lombok.Data;

/**
 * In-memory representation of TTS runtime configuration. The structure mirrors the YAML file and is
 * intentionally simple so that it can be serialised and validated easily.
 */
@Data
public class TtsConfig {

    private Map<String, VoiceGroup> voices = Map.of();
    private Quota quota = new Quota();
    private Cache cache = new Cache();
    private RateLimit ratelimit = new RateLimit();
    private Features features = new Features();

    /**
     * Voice options organised by language. Each language exposes a default voice and an arbitrary
     * number of selectable options.
     */
    @Data
    public static class VoiceGroup {

        @JsonProperty("default")
        private String defaultVoice;

        private List<VoiceOption> options = List.of();
    }

    /** Describes a single voice option. */
    @Data
    public static class VoiceOption {

        private String id;
        private String label;
        private String plan;
    }

    /** Configuration for synthesis quota. */
    @Data
    public static class Quota {

        private Daily daily = new Daily();

        @Data
        public static class Daily {

            private int pro;
            private int free;
        }
    }

    /** Cache related settings. */
    @Data
    public static class Cache {

        private TtlDays ttlDays = new TtlDays();
        private int audioSampleRate;

        @Data
        public static class TtlDays {

            private int pro;
            private int free;
        }
    }

    /** Parameters for rate limiting. */
    @Data
    public static class RateLimit {

        private int userPerMinute;
        private int ipPerMinute;
        private int burst;
        private int cooldownSeconds;
    }

    /** Feature toggles. */
    @Data
    public static class Features {

        private boolean hotReload;
        private boolean useCdn;
        private boolean returnUrl;
        private boolean countCachedAsUsage;
    }
}
