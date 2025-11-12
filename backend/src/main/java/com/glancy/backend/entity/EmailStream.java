package com.glancy.backend.entity;

/** Distinguishes the email communication streams for compliance enforcement. */
public enum EmailStream {
  TRANSACTIONAL,
  MARKETING;

  public boolean isTransactional() {
    return this == TRANSACTIONAL;
  }
}
