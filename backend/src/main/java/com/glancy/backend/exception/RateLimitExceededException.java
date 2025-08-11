package com.glancy.backend.exception;

/**
 * Raised when a request violates configured rate limits.
 */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
