package com.glancy.backend.exception;

/**
 * Base class for business logic exceptions that indicate a recoverable issue triggered by invalid
 * input or application state.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}
