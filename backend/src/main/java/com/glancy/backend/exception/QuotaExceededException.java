package com.glancy.backend.exception;

/**
 * Thrown when a user has exceeded their allotted synthesis quota or attempts to use a voice beyond
 * their subscription plan.
 */
public class QuotaExceededException extends RuntimeException {

    public QuotaExceededException(String message) {
        super(message);
    }
}
