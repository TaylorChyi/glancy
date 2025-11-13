package com.glancy.backend.exception;

/** Thrown when the request lacks valid authentication information. */
public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
