package com.glancy.backend.service.word;

import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.service.SearchRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SearchRecordCoordinator {

    private final SearchRecordService searchRecordService;

    public SearchRecordResponse createRecord(WordQueryContext context) {
        if (!context.captureHistory()) {
            return null;
        }
        SearchRecordRequest request = new SearchRecordRequest();
        request.setTerm(context.rawTerm());
        request.setLanguage(context.language());
        request.setFlavor(context.flavor());
        return searchRecordService.saveRecord(context.userId(), request);
    }

    public void synchronizeRecordTermQuietly(Long userId, Long recordId, String canonicalTerm) {
        if (recordId == null || canonicalTerm == null || canonicalTerm.isBlank()) {
            return;
        }
        try {
            searchRecordService.synchronizeRecordTerm(userId, recordId, canonicalTerm);
        } catch (Exception ex) {
            log.warn(
                    "Failed to synchronize search record {} for user {} with canonical term '{}': {}",
                    recordId,
                    userId,
                    canonicalTerm,
                    ex.getMessage(),
                    ex);
        }
    }
}
