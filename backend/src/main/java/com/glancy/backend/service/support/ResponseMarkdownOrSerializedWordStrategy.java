package com.glancy.backend.service.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Word;
import com.glancy.backend.util.SensitiveDataUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ResponseMarkdownOrSerializedWordStrategy implements WordVersionContentStrategy {

    @Override
    public String resolveContent(WordPersistenceCoordinator.PersistenceContext context, Word savedWord) {
        WordResponse response = context.response();
        if (response != null && response.getMarkdown() != null && !response.getMarkdown().isBlank()) {
            return response.getMarkdown();
        }
        try {
            return context.serializeWord(savedWord);
        } catch (JsonProcessingException e) {
            log.warn(
                "Failed to serialize word '{}' for version content: {}",
                savedWord.getTerm(),
                e.getOriginalMessage(),
                e
            );
            return SensitiveDataUtil.previewText(savedWord.getMarkdown());
        }
    }
}
