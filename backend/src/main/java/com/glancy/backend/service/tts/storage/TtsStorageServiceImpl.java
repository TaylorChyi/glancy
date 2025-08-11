package com.glancy.backend.service.tts.storage;

import com.glancy.backend.entity.TtsAudio;
import com.glancy.backend.entity.TtsScope;
import com.glancy.backend.repository.TtsAudioRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Default implementation that combines JPA persistence with an
 * object storage backend. A {@link Clock} is injected to keep time
 * handling deterministic and testable.
 */
@Service
public class TtsStorageServiceImpl implements TtsStorageService {

    private final TtsAudioRepository repository;
    private final ObjectStorageClient storageClient;
    private final Clock clock;

    public TtsStorageServiceImpl(TtsAudioRepository repository, ObjectStorageClient storageClient, Clock clock) {
        this.repository = repository;
        this.storageClient = storageClient;
        this.clock = clock;
    }

    @Override
    public Optional<TtsAudio> find(String hashKey) {
        return repository.findByHashKey(hashKey);
    }

    @Override
    public TtsAudio save(
        String hashKey,
        String lang,
        String voiceId,
        String format,
        long durationMs,
        byte[] audio,
        TtsScope scope,
        int ttlDays
    ) {
        String objectKey = buildObjectKey(scope, lang, hashKey, format);
        storageClient.putObject(objectKey, audio);

        TtsAudio entity = new TtsAudio();
        entity.setHashKey(hashKey);
        entity.setObjectKey(objectKey);
        entity.setLang(lang);
        entity.setVoiceId(voiceId);
        entity.setDurationMs(durationMs);
        entity.setScope(scope);
        entity.setExpiredAt(LocalDateTime.now(clock).plusDays(ttlDays));
        return repository.save(entity);
    }

    @Override
    public String createTemporaryUrl(String objectKey) {
        return storageClient.generatePresignedGetUrl(objectKey, Duration.ofMinutes(30));
    }

    private String buildObjectKey(TtsScope scope, String lang, String hashKey, String format) {
        LocalDate date = LocalDate.now(clock);
        return String.format(
            "tts/%s/%s/%04d/%02d/%02d/%s.%s",
            scope.name().toLowerCase(),
            lang,
            date.getYear(),
            date.getMonthValue(),
            date.getDayOfMonth(),
            hashKey,
            format
        );
    }
}
