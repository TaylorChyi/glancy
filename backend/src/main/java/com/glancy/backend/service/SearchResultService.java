package com.glancy.backend.service;

import com.glancy.backend.dto.SearchRecordVersionSummary;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.SearchResultVersionRepository;
import com.glancy.backend.service.search.dto.CreateVersionCommand;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Coordinates persistence of search result versions and exposes query helpers. */
@Service
@Slf4j
@RequiredArgsConstructor
public class SearchResultService {

    private static final String DEFAULT_MODEL = "unspecified";

    private final SearchResultVersionRepository searchResultVersionRepository;
    private final SearchRecordRepository searchRecordRepository;

    @Transactional
    public SearchResultVersion createVersion(CreateVersionCommand command) {
        Objects.requireNonNull(command, "command must not be null");
        validateCommand(command);
        SearchRecord record = resolveAccessibleRecord(command.getUserId(), command.getRecordId());
        VersionDraft draft = buildDraft(command, record);
        SearchResultVersion saved = searchResultVersionRepository.save(applyDraft(record, draft));
        logPersistedVersion(saved, record.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<SearchRecordVersionSummary> listVersionSummaries(Long userId, Long recordId) {
        SearchRecord record = resolveAccessibleRecord(userId, recordId);
        return searchResultVersionRepository
                .findBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(record.getId())
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SearchResultVersion getVersionDetail(Long userId, Long recordId, Long versionId) {
        resolveAccessibleRecord(userId, recordId);
        return searchResultVersionRepository
                .findByIdAndSearchRecordIdAndDeletedFalse(versionId, recordId)
                .orElseThrow(() -> new ResourceNotFoundException("结果版本不存在"));
    }

    @Transactional
    public void softDeleteByRecordIds(Collection<Long> recordIds) {
        if (recordIds == null || recordIds.isEmpty()) {
            return;
        }
        int affected = searchResultVersionRepository.softDeleteBySearchRecordIdIn(recordIds);
        log.info("Soft-deleted {} search result versions for records {}", affected, recordIds);
    }

    @Transactional
    public void softDeleteByRecordId(Long recordId) {
        if (recordId == null) {
            return;
        }
        int affected = searchResultVersionRepository.softDeleteBySearchRecordId(recordId);
        log.info("Soft-deleted {} search result versions for record {}", affected, recordId);
    }

    @Transactional(readOnly = true)
    public Optional<SearchRecordVersionSummary> findLatestSummary(Long recordId) {
        return searchResultVersionRepository
                .findTopBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(recordId)
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public Map<Long, List<SearchRecordVersionSummary>> listVersionSummariesByRecordIds(Collection<Long> recordIds) {
        Map<Long, List<SearchRecordVersionSummary>> buckets = initializeBuckets(recordIds);
        if (buckets.isEmpty()) {
            return Map.of();
        }
        appendVersionSummaries(buckets, loadVersions(buckets.keySet()));
        return snapshotBuckets(buckets);
    }

    private int determineNextVersionNumber(Long recordId) {
        return searchResultVersionRepository
                .findTopBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(recordId)
                .map(version -> version.getVersionNumber() + 1)
                .orElse(1);
    }

    private SearchRecord resolveAccessibleRecord(Long userId, Long recordId) {
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(recordId, "recordId must not be null");
        SearchRecord record = searchRecordRepository
                .findByIdAndDeletedFalse(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
        if (!record.getUser().getId().equals(userId)) {
            log.warn("User {} attempted to access record {} not owned by them", userId, recordId);
            throw new ResourceNotFoundException("搜索记录不存在");
        }
        return record;
    }

    private SearchRecordVersionSummary toSummary(SearchResultVersion version) {
        return new SearchRecordVersionSummary(
                version.getId(),
                version.getVersionNumber(),
                version.getCreatedAt(),
                version.getModel(),
                version.getPreview(),
                version.getFlavor());
    }

    private void validateCommand(CreateVersionCommand command) {
        Objects.requireNonNull(command.getRecordId(), "recordId must not be null");
        Objects.requireNonNull(command.getUserId(), "userId must not be null");
        Objects.requireNonNull(command.getContent(), "content must not be null");
    }

    private VersionDraft buildDraft(CreateVersionCommand command, SearchRecord record) {
        String effectiveModel = defaultIfBlank(command.getModel(), DEFAULT_MODEL);
        String effectiveTerm = defaultIfBlank(command.getTerm(), record.getTerm());
        Language effectiveLanguage = command.getLanguage() == null ? record.getLanguage() : command.getLanguage();
        DictionaryFlavor effectiveFlavor = Objects.requireNonNullElse(command.getFlavor(), DictionaryFlavor.BILINGUAL);
        int nextVersion = determineNextVersionNumber(record.getId());
        return new VersionDraft(
                effectiveTerm,
                effectiveLanguage,
                effectiveModel,
                effectiveFlavor,
                nextVersion,
                command.getContent(),
                command.getWord());
    }

    private static String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private SearchResultVersion applyDraft(SearchRecord record, VersionDraft draft) {
        SearchResultVersion version = new SearchResultVersion();
        version.setSearchRecord(record);
        version.setUser(record.getUser());
        version.setWord(draft.word());
        version.setTerm(draft.term());
        version.setLanguage(draft.language());
        version.setModel(draft.model());
        version.setFlavor(draft.flavor());
        version.setVersionNumber(draft.versionNumber());
        version.setContent(draft.content());
        version.setPreview(SensitiveDataUtil.previewText(draft.content()));
        return version;
    }

    private void logPersistedVersion(SearchResultVersion saved, Long recordId) {
        log.info(
                "Persisted search result version {} for record {} "
                        + "(term='{}', language={}, flavor={}, model={}, versionNumber={})",
                saved.getId(),
                recordId,
                saved.getTerm(),
                saved.getLanguage(),
                saved.getFlavor(),
                saved.getModel(),
                saved.getVersionNumber());
    }

    private Map<Long, List<SearchRecordVersionSummary>> initializeBuckets(Collection<Long> recordIds) {
        if (recordIds == null) {
            return Map.of();
        }
        Map<Long, List<SearchRecordVersionSummary>> grouped = new LinkedHashMap<>();
        recordIds.stream().filter(Objects::nonNull).forEach(id -> grouped.putIfAbsent(id, new ArrayList<>()));
        return grouped;
    }

    private List<SearchResultVersion> loadVersions(Collection<Long> recordIds) {
        if (recordIds.isEmpty()) {
            return List.of();
        }
        return searchResultVersionRepository
                .findBySearchRecordIdInAndDeletedFalseOrderBySearchRecordIdAscVersionNumberDesc(recordIds);
    }

    private void appendVersionSummaries(
            Map<Long, List<SearchRecordVersionSummary>> buckets, List<SearchResultVersion> versions) {
        for (SearchResultVersion version : versions) {
            Long id = version.getSearchRecord().getId();
            buckets.computeIfAbsent(id, key -> new ArrayList<>()).add(toSummary(version));
        }
    }

    private Map<Long, List<SearchRecordVersionSummary>> snapshotBuckets(
            Map<Long, List<SearchRecordVersionSummary>> buckets) {
        return buckets.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> List.copyOf(entry.getValue()),
                        (left, right) -> left,
                        LinkedHashMap::new));
    }

    private record VersionDraft(
            String term,
            Language language,
            String model,
            DictionaryFlavor flavor,
            int versionNumber,
            String content,
            Word word) {}
}
