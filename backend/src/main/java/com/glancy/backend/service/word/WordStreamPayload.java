package com.glancy.backend.service.word;


public record WordStreamPayload(String event, String data) {
    public static WordStreamPayload data(String data) {
        return new WordStreamPayload(null, data);
    }

    public static WordStreamPayload version(String versionId) {
        return new WordStreamPayload("version", versionId);
    }
}
