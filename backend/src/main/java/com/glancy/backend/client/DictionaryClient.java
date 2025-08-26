package com.glancy.backend.client;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;

/** Common interface for third-party dictionary clients. */
public interface DictionaryClient {
  /** Fetch the definition of the given term in the specified language. */
  WordResponse fetchDefinition(String term, Language language);

  /**
   * Fetch pronunciation audio for the given term and language. Implementations may throw
   * UnsupportedOperationException if not supported.
   */
  byte[] fetchAudio(String term, Language language);
}
