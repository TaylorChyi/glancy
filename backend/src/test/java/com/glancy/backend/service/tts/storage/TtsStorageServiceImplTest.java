package com.glancy.backend.service.tts.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
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
import java.util.Optional;
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
     * Saving audio should persist metadata with a deterministic object
     * key structure.
     */
    @Test
    void savePersistsMetadata() {
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        byte[] audio = new byte[] { 1, 2, 3 };
        String hash = "hash";
        Optional<TtsAudio> result = service.save(hash, "en", "v1", "mp3", 500L, audio, TtsScope.WORD, 30);

        String expectedKey = "tts/word/en/2024/01/02/hash.mp3";

        ArgumentCaptor<TtsAudio> captor = ArgumentCaptor.forClass(TtsAudio.class);
        verify(repository).save(captor.capture());
        assertTrue(result.isPresent());
        TtsAudio saved = result.get();
        assertEquals(expectedKey, saved.getObjectKey());
        assertEquals("en", saved.getLang());
        assertEquals("v1", saved.getVoiceId());
        assertEquals(500L, saved.getDurationMs());
        assertEquals(TtsScope.WORD, saved.getScope());
        assertEquals(LocalDateTime.of(2024, 1, 2, 3, 4, 5).plusDays(30), saved.getExpiredAt());
    }

    /**
     * Upload failures should not propagate exceptions and skip caching.
     */
    @Test
    void saveReturnsEmptyWhenUploadFails() {
        byte[] audio = new byte[] { 1 };
        doThrow(new RuntimeException("boom")).when(storageClient).putObject(any(), any());
        Optional<TtsAudio> result = service.save("hash", "en", "v1", "mp3", 100L, audio, TtsScope.WORD, 30);
        assertFalse(result.isPresent());
        verify(repository, never()).save(any());
    }

    /**
     * Temporary URLs should be constructed with a fixed 30 minute
     * validity window.
     */
    @Test
    void createTemporaryUrlReturnsPresignedUrl() {
        when(storageClient.generatePresignedGetUrl("key", Duration.ofMinutes(30))).thenReturn("url");
        String url = service.createTemporaryUrl("key");
        assertEquals("url", url);
    }
}
