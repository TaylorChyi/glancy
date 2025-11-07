package com.glancy.backend.service.word;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.util.SensitiveDataUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WordPersonalizationApplier {

    private final WordPersonalizationService wordPersonalizationService;

    public WordResponse apply(Long userId, WordResponse response, WordPersonalizationContext context) {
        if (response == null) {
            return null;
        }
        try {
            WordPersonalizationContext effectiveContext = context != null
                ? context
                : wordPersonalizationService.resolveContext(userId);
            response.setPersonalization(wordPersonalizationService.personalize(effectiveContext, response));
        } catch (Exception ex) {
            log.warn(
                "Failed to personalize response for user {} term '{}': {}",
                userId,
                response.getTerm(),
                SensitiveDataUtil.previewText(ex.getMessage())
            );
        }
        return response;
    }
}
