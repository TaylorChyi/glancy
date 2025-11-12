package com.glancy.backend.service.word;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;

/** Command object capturing the parameters required to perform a word lookup. */
public record WordSearchOptions(
    String term,
    Language language,
    DictionaryFlavor flavor,
    String model,
    boolean forceNew,
    boolean captureHistory) {
  public static WordSearchOptions of(
      String term,
      Language language,
      DictionaryFlavor flavor,
      String model,
      boolean forceNew,
      boolean captureHistory) {
    return new WordSearchOptions(term, language, flavor, model, forceNew, captureHistory);
  }
}
