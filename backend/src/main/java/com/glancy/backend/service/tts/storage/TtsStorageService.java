package com.glancy.backend.service.tts.storage;

import com.glancy.backend.entity.TtsAudio;
import com.glancy.backend.entity.TtsScope;
import java.util.Optional;

/**
 * Coordinates persistence of synthesised audio. It consults the
 * database-backed cache before delegating to an object storage service
 * for the actual binary payload.
 */
public interface TtsStorageService {
    /** Lookup audio metadata by its cache hash. */
    Optional<TtsAudio> find(String hashKey);

    /**
     * Store a newly synthesised audio file and persist its metadata.
     *
     * @param hashKey deterministic cache identifier
     * @param lang language of the text
     * @param voiceId voice used for synthesis
     * @param format audio format
     * @param durationMs playback duration
     * @param audio binary audio payload
     * @param scope word or sentence context
     * @param ttlDays days until the cache entry expires
     * @return persisted metadata entity
     */
    TtsAudio save(
        String hashKey,
        String lang,
        String voiceId,
        String format,
        long durationMs,
        byte[] audio,
        TtsScope scope,
        int ttlDays
    );

    /** Generate a temporary access URL for the stored object. */
    String createTemporaryUrl(String objectKey);
}
