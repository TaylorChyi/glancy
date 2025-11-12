package com.glancy.backend.entity;

/** Supported dictionary models for word lookup. */
public enum DictionaryModel {
  DOUBAO;

  /** Resolve the LLM client identifier associated with this model. */
  public String getClientName() {
    return switch (this) {
      case DOUBAO -> "doubao";
    };
  }
}
