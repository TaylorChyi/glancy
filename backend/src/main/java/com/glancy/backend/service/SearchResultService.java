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
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Coordinates persistence of search result versions and exposes query helpers.
 */
@Service
@Slf4j
public class SearchResultService {

    private static final String DEFAULT_MODEL = "unspecified";

    private final SearchResultVersionRepository searchResultVersionRepository;
    private final SearchRecordRepository searchRecordRepository;

    public SearchResultService(
        SearchResultVersionRepository searchResultVersionRepository,
        SearchRecordRepository searchRecordRepository
    ) {
        this.searchResultVersionRepository = searchResultVersionRepository;
        this.searchRecordRepository = searchRecordRepository;
    }

    @Transactional
    public SearchResultVersion createVersion(
        Long recordId,
        Long userId,
        String term,
        Language language,
        String model,
        String content,
        Word word,
        DictionaryFlavor flavor
    ) {
        Objects.requireNonNull(recordId, "recordId must not be null");
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(content, "content must not be null");

        SearchRecord record = searchRecordRepository
            .findByIdAndDeletedFalse(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
        if (!record.getUser().getId().equals(userId)) {
            log.warn("User {} attempted to persist version for record {} not owned by them", userId, recordId);
            throw new ResourceNotFoundException("搜索记录不存在");
        }

        String effectiveModel = model == null || model.isBlank() ? DEFAULT_MODEL : model;
        String effectiveTerm = term == null || term.isBlank() ? record.getTerm() : term;
        Language effectiveLanguage = language == null ? record.getLanguage() : language;

        int nextVersionNumber = determineNextVersionNumber(recordId);

        SearchResultVersion version = new SearchResultVersion();
        version.setSearchRecord(record);
        version.setUser(record.getUser());
        version.setWord(word);
        version.setTerm(effectiveTerm);
        version.setLanguage(effectiveLanguage);
        version.setModel(effectiveModel);
        version.setFlavor(flavor != null ? flavor : DictionaryFlavor.BILINGUAL);
        version.setVersionNumber(nextVersionNumber);
        version.setContent(content);
        version.setPreview(SensitiveDataUtil.previewText(content));

        SearchResultVersion saved = searchResultVersionRepository.save(version);
        log.info(
            "Persisted search result version {} for record {} (term='{}', language={}, flavor={}, model={}, versionNumber={})",
            saved.getId(),
            recordId,
            saved.getTerm(),
            saved.getLanguage(),
            saved.getFlavor(),
            saved.getModel(),
            saved.getVersionNumber()
        );
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
            version.getFlavor()
        );
    }
}
