package com.glancy.backend.llm.search;

import org.springframework.stereotype.Component;

@Component
public class SearchContentManagerImpl implements SearchContentManager {

    @Override
    public String normalize(String input) {
        return input == null ? "" : input.trim().toLowerCase();
    }
}
