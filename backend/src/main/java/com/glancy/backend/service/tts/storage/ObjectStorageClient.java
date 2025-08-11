package com.glancy.backend.service.tts.storage;

import java.time.Duration;

/**
 * Minimal abstraction over an object storage provider. It allows the
 * TTS module to store and retrieve audio files without depending on a
 * particular vendor SDK.
 */
public interface ObjectStorageClient {

    /** Persist the given payload under the specified key. */
    void putObject(String key, byte[] content);

    /** Generate a pre-signed GET URL valid for the provided duration. */
    String generatePresignedGetUrl(String key, Duration ttl);
}
