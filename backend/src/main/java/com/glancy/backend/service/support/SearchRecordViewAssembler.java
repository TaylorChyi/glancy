package com.glancy.backend.service.support;

import com.glancy.backend.dto.search.SearchRecordResponse;
import com.glancy.backend.dto.search.SearchRecordVersionSummary;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.mapper.SearchRecordMapper;
import com.glancy.backend.service.SearchResultService;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Assembles {@link SearchRecordResponse} instances with version metadata in a batch-aware fashion.
 */
@Component
public class SearchRecordViewAssembler {

    private final SearchRecordMapper searchRecordMapper;
    private final SearchResultService searchResultService;

    public SearchRecordViewAssembler(SearchRecordMapper searchRecordMapper, SearchResultService searchResultService) {
        this.searchRecordMapper = searchRecordMapper;
        this.searchResultService = searchResultService;
    }

    public SearchRecordResponse assembleSingle(Long userId, SearchRecord record) {
        if (record == null) {
            return null;
        }
        List<SearchRecordResponse> responses = assemble(userId, List.of(record));
        return responses.isEmpty() ? null : responses.get(0);
    }

    public List<SearchRecordResponse> assemble(Long userId, List<SearchRecord> records) {
        if (records == null || records.isEmpty()) {
            return List.of();
        }
        List<Long> recordIds = extractRecordIds(records);
        Map<Long, List<SearchRecordVersionSummary>> groupedVersions =
            searchResultService.listVersionSummariesByRecordIds(recordIds);
        return records
            .stream()
            .map(record -> toResponse(record, groupedVersions.getOrDefault(record.getId(), List.of())))
            .collect(Collectors.toList());
    }

    private List<Long> extractRecordIds(Collection<SearchRecord> records) {
        return records.stream().map(SearchRecord::getId).filter(Objects::nonNull).collect(Collectors.toList());
    }

    private SearchRecordResponse toResponse(SearchRecord record, List<SearchRecordVersionSummary> versions) {
        SearchRecordResponse base = searchRecordMapper.toResponse(record);
        SearchRecordVersionSummary latest = versions.isEmpty() ? null : versions.get(0);
        return base.withVersionDetails(latest, versions);
    }
}
