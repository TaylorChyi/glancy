package com.glancy.backend.service.support;

import com.glancy.backend.entity.Word;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;


@Slf4j
@Component
public class SanitizedStreamingMarkdownStrategy implements WordVersionContentStrategy {

    @Override
    public String resolveContent(WordPersistenceCoordinator.PersistenceContext context, Word savedWord) {
        String sanitized = context.sanitizedMarkdown();
        if (sanitized == null || sanitized.isBlank()) {
            log.warn(
                "Sanitized markdown missing for term '{}', falling back to persisted markdown",
                savedWord.getTerm()
            );
            return savedWord.getMarkdown();
        }
        return sanitized;
    }
}
