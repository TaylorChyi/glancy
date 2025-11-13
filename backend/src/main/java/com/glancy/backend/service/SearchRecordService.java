package com.glancy.backend.service;

import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.service.support.SearchRecordPageRequest;
import jakarta.transaction.Transactional;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Facade delegating search record commands and queries to focused collaborators. */
@Service
@RequiredArgsConstructor
public class SearchRecordService {

    private final SearchRecordCommandService commandService;
    private final SearchRecordQueryService queryService;

    @Transactional
    public SearchRecordResponse saveRecord(Long userId, SearchRecordRequest request) {
        return commandService.saveRecord(userId, request);
    }

    @Transactional
    public SearchRecordResponse favoriteRecord(Long userId, Long recordId) {
        return commandService.favoriteRecord(userId, recordId);
    }

    @Transactional
    public void clearRecords(Long userId) {
        commandService.clearRecords(userId);
    }

    @Transactional
    public void unfavoriteRecord(Long userId, Long recordId) {
        commandService.unfavoriteRecord(userId, recordId);
    }

    @Transactional
    public SearchRecordResponse synchronizeRecordTerm(Long userId, Long recordId, String canonicalTerm) {
        return commandService.synchronizeRecordTerm(userId, recordId, canonicalTerm);
    }

    @Transactional
    public void deleteRecord(Long userId, Long recordId) {
        commandService.deleteRecord(userId, recordId);
    }

    @Transactional
    public List<SearchRecordResponse> getRecords(Long userId) {
        return getRecords(userId, SearchRecordPageRequest.firstPage());
    }

    @Transactional
    public List<SearchRecordResponse> getRecords(Long userId, int page, int size) {
        return getRecords(userId, SearchRecordPageRequest.of(page, size));
    }

    @Transactional
    public List<SearchRecordResponse> getRecords(Long userId, SearchRecordPageRequest pageRequest) {
        return queryService.getRecords(userId, pageRequest);
    }
}
