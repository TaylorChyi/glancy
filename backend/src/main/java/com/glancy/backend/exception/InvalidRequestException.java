package com.glancy.backend.exception;

/** Thrown when a request violates business rules or contains invalid parameters. */
public class InvalidRequestException extends BusinessException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
