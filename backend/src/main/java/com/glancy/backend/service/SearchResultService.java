package com.glancy.backend.service;

import com.glancy.backend.dto.SearchResultVersionResponse;
import com.glancy.backend.dto.SearchResultVersionSummaryResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.Word;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.mapper.SearchResultVersionMapper;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.SearchResultVersionRepository;
import com.glancy.backend.repository.WordRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Manages persistence and retrieval of search result versions.
 */
@Slf4j
@Service
public class SearchResultService {

    private static final int PREVIEW_MAX_LENGTH = 120;

    private final SearchResultVersionRepository versionRepository;
    private final SearchRecordRepository searchRecordRepository;
    private final WordRepository wordRepository;
    private final SearchResultVersionMapper versionMapper;

    public SearchResultService(
        SearchResultVersionRepository versionRepository,
        SearchRecordRepository searchRecordRepository,
        WordRepository wordRepository,
        SearchResultVersionMapper versionMapper
    ) {
        this.versionRepository = versionRepository;
        this.searchRecordRepository = searchRecordRepository;
        this.wordRepository = wordRepository;
        this.versionMapper = versionMapper;
    }

    @Transactional
    public SearchResultVersion recordVersion(VersionCommand command) {
        log.info(
            "Recording search result version for user {} record {} term '{}' with model {}",
            command.userId(),
            command.searchRecordId(),
            command.term(),
            command.model()
        );
        SearchRecord searchRecord = searchRecordRepository
            .findByIdAndDeletedFalse(command.searchRecordId())
            .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
        if (!searchRecord.getUser().getId().equals(command.userId())) {
            log.warn(
                "Search record {} does not belong to user {} when recording version",
                command.searchRecordId(),
                command.userId()
            );
            throw new ResourceNotFoundException("搜索记录不存在");
        }
        User user = searchRecord.getUser();
        Word word = null;
        if (command.wordId() != null) {
            word = wordRepository
                .findById(command.wordId())
                .filter(w -> Boolean.FALSE.equals(w.getDeleted()))
                .orElse(null);
        }
        Long nextVersion = versionRepository
            .findTopBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(command.searchRecordId())
            .map(SearchResultVersion::getVersionNumber)
            .map(n -> n + 1)
            .orElse(1L);
        SearchResultVersion version = new SearchResultVersion();
        version.setSearchRecord(searchRecord);
        version.setUser(user);
        version.setWord(word);
        version.setTerm(command.term());
        version.setLanguage(command.language());
        version.setModel(command.model());
        version.setVersionNumber(nextVersion);
        version.setContent(command.content());
        version.setPreview(buildPreview(command.content()));
        SearchResultVersion saved = versionRepository.save(version);
        log.info(
            "Persisted version {} for record {} with preview {}",
            saved.getId(),
            saved.getSearchRecord().getId(),
            saved.getPreview()
        );
        return saved;
    }

    @Transactional
    public void softDeleteByRecordId(Long recordId) {
        log.info("Soft deleting versions for record {}", recordId);
        versionRepository.softDeleteBySearchRecordId(recordId);
    }

    @Transactional
    public void softDeleteByRecordIds(Collection<Long> recordIds) {
        if (recordIds.isEmpty()) {
            return;
        }
        log.info("Soft deleting versions for records {}", recordIds);
        versionRepository.softDeleteBySearchRecordIds(recordIds);
    }

    @Transactional
    public List<SearchResultVersionSummaryResponse> listSummaries(Long userId, Long recordId) {
        log.info("Listing versions for user {} record {}", userId, recordId);
        ensureRecordOwnership(userId, recordId);
        return versionRepository
            .findBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(recordId)
            .stream()
            .map(versionMapper::toSummary)
            .toList();
    }

    @Transactional
    public SearchResultVersionResponse getVersion(Long userId, Long recordId, Long versionId) {
        log.info(
            "Fetching version {} for user {} record {}",
            versionId,
            userId,
            recordId
        );
        ensureRecordOwnership(userId, recordId);
        SearchResultVersion version = versionRepository
            .findByIdAndUserIdAndDeletedFalse(versionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("版本不存在"));
        if (!version.getSearchRecord().getId().equals(recordId)) {
            throw new ResourceNotFoundException("版本不存在");
        }
        return versionMapper.toResponse(version);
    }

    @Transactional
    public SearchResultVersionSummaryResponse findLatestSummary(Long recordId) {
        Optional<SearchResultVersion> latest = versionRepository
            .findTopBySearchRecordIdAndDeletedFalseOrderByVersionNumberDesc(recordId);
        return latest.map(versionMapper::toSummary).orElse(null);
    }

    private void ensureRecordOwnership(Long userId, Long recordId) {
        searchRecordRepository
            .findByIdAndDeletedFalse(recordId)
            .filter(record -> record.getUser().getId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
    }

    private String buildPreview(String content) {
        if (!StringUtils.hasText(content)) {
            return "";
        }
        if (content.length() <= PREVIEW_MAX_LENGTH) {
            return content;
        }
        return content.substring(0, PREVIEW_MAX_LENGTH) + "...";
    }

    public record VersionCommand(
        Long userId,
        Long searchRecordId,
        Long wordId,
        String term,
        Language language,
        String model,
        String content
    ) {}
}
