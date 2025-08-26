package com.glancy.backend.entity;

/** Available large language models. */
public enum LlmModel {
  DEEPSEEK("deepseek-chat"),
  DOUBAO_FLASH("doubao-seed-1-6-flash-250715");

  private final String modelName;

  LlmModel(String modelName) {
    this.modelName = modelName;
  }

  public String getModelName() {
    return modelName;
  }
}
