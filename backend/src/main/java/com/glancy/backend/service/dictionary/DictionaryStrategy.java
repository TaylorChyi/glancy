package com.glancy.backend.service.dictionary;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;

/** Strategy interface for dictionary lookups. */
public interface DictionaryStrategy {
  WordResponse fetch(String term, Language language);
}
