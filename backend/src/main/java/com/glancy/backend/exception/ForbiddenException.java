package com.glancy.backend.exception;

/**
 * Thrown when a request is understood but refuses to authorize.
 */
public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super(message);
    }
}
