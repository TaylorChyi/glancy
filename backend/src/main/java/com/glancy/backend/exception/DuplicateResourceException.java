package com.glancy.backend.exception;

/**
 * Thrown when attempting to create a resource that already exists.
 */
public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
