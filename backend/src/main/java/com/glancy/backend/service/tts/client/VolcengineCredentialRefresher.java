package com.glancy.backend.service.tts.client;

@FunctionalInterface
public interface VolcengineCredentialRefresher {
    /** Refreshes credentials used for Volcengine requests. */
    void refresh();
}
