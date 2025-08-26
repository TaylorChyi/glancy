package com.glancy.backend.exception;

/** Thrown when the requested entity does not exist. */
public class ResourceNotFoundException extends BusinessException {

  public ResourceNotFoundException(String message) {
    super(message);
  }
}
