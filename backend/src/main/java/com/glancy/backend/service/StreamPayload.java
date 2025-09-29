package com.glancy.backend.service;

/**
 * Payload wrapper for server-sent events emitted during word lookup streaming.
 */
public record StreamPayload(String event, String data) {
    public static StreamPayload data(String data) {
        return new StreamPayload(null, data);
    }

    public static StreamPayload version(String versionId) {
        return new StreamPayload("version", versionId);
    }
}
