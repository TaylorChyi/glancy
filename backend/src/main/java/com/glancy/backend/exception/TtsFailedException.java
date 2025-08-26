package com.glancy.backend.exception;

/** Indicates that the downstream TTS provider failed to synthesize the requested audio. */
public class TtsFailedException extends RuntimeException {

  public TtsFailedException(String message) {
    super(message);
  }
}
