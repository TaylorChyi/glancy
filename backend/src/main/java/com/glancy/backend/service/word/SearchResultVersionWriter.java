package com.glancy.backend.service.word;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.service.SearchResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SearchResultVersionWriter {

    private final SearchResultService searchResultService;

    public SearchResultVersion persistVersion(
        Long recordId,
        Long userId,
        String model,
        String content,
        Word word,
        DictionaryFlavor flavor
    ) {
        if (recordId == null) {
            return null;
        }
        return searchResultService.createVersion(
            recordId,
            userId,
            word.getTerm(),
            word.getLanguage(),
            model,
            content,
            word,
            flavor
        );
    }
}
