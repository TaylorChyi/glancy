package com.glancy.backend.entity;

/** Dictionary output modes that control how entries should be rendered. */
public enum DictionaryFlavor {
  /** Bilingual presentation mixing English explanations with supporting Chinese context. */
  BILINGUAL,

  /** Monolingual English presentation without any translated content. */
  MONOLINGUAL_ENGLISH,

  /** Monolingual Chinese presentation designed for native-language explanations. */
  MONOLINGUAL_CHINESE;

  public static DictionaryFlavor fromNullable(String raw, DictionaryFlavor fallback) {
    if (raw == null || raw.isBlank()) {
      return fallback;
    }
    try {
      return DictionaryFlavor.valueOf(raw.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      return fallback;
    }
  }
}
