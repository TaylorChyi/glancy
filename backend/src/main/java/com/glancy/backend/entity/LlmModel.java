package com.glancy.backend.entity;

/**
 * Available large language models.
 */
public enum LlmModel {
    /** Default Doubao model. */
    DOUBAO("doubao-seed-1-6-flash-250715");

    private final String modelName;

    LlmModel(String modelName) {
        this.modelName = modelName;
    }

    public String getModelName() {
        return modelName;
    }
}
