package com.glancy.backend.exception;

/**
 * Used when the service is intentionally degraded and cannot fulfill synthesis requests at the
 * moment.
 */
public class ServiceDegradedException extends RuntimeException {

    public ServiceDegradedException(String message) {
        super(message);
    }
}
