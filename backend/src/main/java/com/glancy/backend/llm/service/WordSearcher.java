package com.glancy.backend.llm.service;

import com.glancy.backend.entity.Language;
import reactor.core.publisher.Flux;

public interface WordSearcher {
  Flux<String> streamSearch(String term, Language language, String clientName);
}
