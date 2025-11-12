package com.glancy.backend.service.support;

import com.glancy.backend.llm.search.SearchContentManager;
import org.springframework.stereotype.Component;

@Component
public class SearchContentDictionaryTermNormalizer implements DictionaryTermNormalizer {

  private final SearchContentManager searchContentManager;

  public SearchContentDictionaryTermNormalizer(SearchContentManager searchContentManager) {
    this.searchContentManager = searchContentManager;
  }

  @Override
  public String normalize(String term) {
    return searchContentManager.normalize(term);
  }
}
