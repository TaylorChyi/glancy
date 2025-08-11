package com.glancy.backend.service.tts.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.glancy.backend.entity.TtsAudio;
import com.glancy.backend.entity.TtsScope;
import com.glancy.backend.repository.TtsAudioRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

/**
 * Tests for {@link TtsStorageServiceImpl}. These focus on verifying the
 * contract with the repository and object storage abstraction.
 */
class TtsStorageServiceImplTest {

    @Mock
    private TtsAudioRepository repository;

    @Mock
    private ObjectStorageClient storageClient;

    private TtsStorageServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        Clock clock = Clock.fixed(Instant.parse("2024-01-02T03:04:05Z"), ZoneOffset.UTC);
        service = new TtsStorageServiceImpl(repository, storageClient, clock);
    }

    /**
     * Saving audio should upload the binary payload and persist metadata
     * with a deterministic object key structure.
     */
    @Test
    void saveUploadsAndPersistsMetadata() {
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        byte[] audio = new byte[] {1, 2, 3};
        String hash = "hash";
        service.save(hash, "en", "v1", "mp3", 500L, audio, TtsScope.WORD, 30);

        String expectedKey = "tts/word/en/2024/01/02/hash.mp3";
        verify(storageClient).putObject(eq(expectedKey), eq(audio));

        ArgumentCaptor<TtsAudio> captor = ArgumentCaptor.forClass(TtsAudio.class);
        verify(repository).save(captor.capture());
        TtsAudio saved = captor.getValue();
        assertEquals(expectedKey, saved.getObjectKey());
        assertEquals("en", saved.getLang());
        assertEquals("v1", saved.getVoiceId());
        assertEquals(500L, saved.getDurationMs());
        assertEquals(TtsScope.WORD, saved.getScope());
        assertEquals(
            LocalDateTime.of(2024, 1, 2, 3, 4, 5).plusDays(30),
            saved.getExpiredAt()
        );
    }

    /**
     * Temporary URLs should delegate to the storage client with a fixed
     * 30 minute validity window.
     */
    @Test
    void createTemporaryUrlDelegatesToStorageClient() {
        when(storageClient.generatePresignedGetUrl("key", Duration.ofMinutes(30))).thenReturn("url");
        String url = service.createTemporaryUrl("key");
        assertEquals("url", url);
        verify(storageClient).generatePresignedGetUrl("key", Duration.ofMinutes(30));
    }
}
