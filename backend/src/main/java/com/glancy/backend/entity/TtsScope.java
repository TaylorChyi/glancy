package com.glancy.backend.entity;

/**
 * Distinguishes between synthesis for individual words and longer sentences. The distinction feeds
 * into cache key generation and storage layout so that content with different semantics does not
 * collide.
 */
public enum TtsScope {
    WORD,
    SENTENCE,
}
