package com.glancy.backend.service;

import com.glancy.backend.config.SearchProperties;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.support.SearchRecordPageRequest;
import com.glancy.backend.service.support.SearchRecordViewAssembler;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages persistence of search records and enforces daily limits
 * for non-member users.
 */
@Slf4j
@Service
public class SearchRecordService {

    private final SearchRecordRepository searchRecordRepository;
    private final UserRepository userRepository;
    private final SearchResultService searchResultService;
    private final SearchRecordViewAssembler searchRecordViewAssembler;
    private final int nonMemberSearchLimit;

    public SearchRecordService(
        SearchRecordRepository searchRecordRepository,
        UserRepository userRepository,
        SearchProperties properties,
        SearchResultService searchResultService,
        SearchRecordViewAssembler searchRecordViewAssembler
    ) {
        this.searchRecordRepository = searchRecordRepository;
        this.userRepository = userRepository;
        this.searchResultService = searchResultService;
        this.searchRecordViewAssembler = searchRecordViewAssembler;
        this.nonMemberSearchLimit = properties.getLimit().getNonMember();
    }

    /**
     * Save a search record for a user and apply daily limits if the
     * user is not a member.
     */
    @Transactional
    public SearchRecordResponse saveRecord(Long userId, SearchRecordRequest request) {
        log.info("Saving search record for user {} with term '{}'", userId, request.getTerm());
        User user = userRepository
            .findById(userId)
            .orElseThrow(() -> {
                log.warn("User with id {} not found", userId);
                return new ResourceNotFoundException("用户不存在");
            });
        if (user.getLastLoginAt() == null) {
            log.warn("User {} is not logged in", userId);
            throw new InvalidRequestException("用户未登录");
        }
        DictionaryFlavor flavor = request.getFlavor() != null ? request.getFlavor() : DictionaryFlavor.BILINGUAL;
        SearchRecord existing =
            searchRecordRepository.findTopByUserIdAndTermAndLanguageAndFlavorAndDeletedFalseOrderByCreatedAtDesc(
                userId,
                request.getTerm(),
                request.getLanguage(),
                flavor
            );
        if (existing != null) {
            log.info("Existing record found: {}", describeRecord(existing));
            existing.setCreatedAt(LocalDateTime.now());
            SearchRecord updated = searchRecordRepository.save(existing);
            log.info("Updated record persisted: {}", describeRecord(updated));
            SearchRecordResponse response = searchRecordViewAssembler.assembleSingle(userId, updated);
            log.info("Returning record response: {}", describeResponse(response));
            return response;
        }

        if (Boolean.FALSE.equals(user.getMember())) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);
            long count = searchRecordRepository.countByUserIdAndDeletedFalseAndCreatedAtBetween(
                userId,
                startOfDay,
                endOfDay
            );
            if (count >= nonMemberSearchLimit) {
                log.warn("User {} exceeded daily search limit", userId);
                throw new InvalidRequestException("非会员每天只能搜索" + nonMemberSearchLimit + "次");
            }
        }
        SearchRecord record = new SearchRecord();
        record.setUser(user);
        record.setTerm(request.getTerm());
        record.setLanguage(request.getLanguage());
        record.setFlavor(flavor);
        SearchRecord saved = searchRecordRepository.save(record);
        log.info("Persisted new search record: {}", describeRecord(saved));
        SearchRecordResponse response = searchRecordViewAssembler.assembleSingle(userId, saved);
        log.info("Returning record response: {}", describeResponse(response));
        return response;
    }

    /**
     * Mark a search record as favorite for the user.
     */
    @Transactional
    public SearchRecordResponse favoriteRecord(Long userId, Long recordId) {
        log.info("Favoriting search record {} for user {}", recordId, userId);
        SearchRecord record = searchRecordRepository
            .findByIdAndUserIdAndDeletedFalse(recordId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
        record.setFavorite(true);
        SearchRecord saved = searchRecordRepository.save(record);
        log.info("Record after favoriting: {}", describeRecord(saved));
        SearchRecordResponse response = searchRecordViewAssembler.assembleSingle(userId, saved);
        log.info("Favorite response: {}", describeResponse(response));
        return response;
    }

    /**
     * Retrieve the first page of a user's search history with the default size.
     */
    @Transactional(readOnly = true)
    public List<SearchRecordResponse> getRecords(Long userId) {
        return getRecords(userId, SearchRecordPageRequest.firstPage());
    }

    /**
     * Retrieve a specific page of a user's search history ordered by creation time.
     */
    @Transactional(readOnly = true)
    public List<SearchRecordResponse> getRecords(Long userId, int page, int size) {
        return getRecords(userId, SearchRecordPageRequest.of(page, size));
    }

    /**
     * Retrieve a specific page of a user's search history ordered by creation time.
     */
    @Transactional(readOnly = true)
    public List<SearchRecordResponse> getRecords(Long userId, SearchRecordPageRequest pageRequest) {
        Pageable pageable = pageRequest.toPageable(Sort.by(Sort.Direction.DESC, "createdAt"));
        log.info(
            "Fetching search records for user {} with page {} and size {}",
            userId,
            pageRequest.page(),
            pageRequest.size()
        );
        List<SearchRecord> records = searchRecordRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(
            userId,
            pageable
        );
        log.info("Retrieved {} records from database for user {}", records.size(), userId);
        records.forEach(r -> log.debug("Fetched record: {}", describeRecord(r)));
        return searchRecordViewAssembler
            .assemble(userId, records)
            .stream()
            .peek(response -> log.debug("Record response: {}", describeResponse(response)))
            .toList();
    }

    /**
     * Remove all search records for the given user.
     */
    @Transactional
    public void clearRecords(Long userId) {
        List<SearchRecord> records = searchRecordRepository.findByUserIdAndDeletedFalse(userId);
        log.info("Clearing {} search records for user {}", records.size(), userId);
        if (records.isEmpty()) {
            return;
        }
        records.forEach(record -> record.setDeleted(true));
        searchResultService.softDeleteByRecordIds(
            records.stream().map(SearchRecord::getId).filter(Objects::nonNull).toList()
        );
        searchRecordRepository.saveAll(records);
    }

    /**
     * Cancel favorite status for a user's search record.
     */
    @Transactional
    public void unfavoriteRecord(Long userId, Long recordId) {
        log.info("Unfavoriting search record {} for user {}", recordId, userId);
        SearchRecord record = searchRecordRepository
            .findByIdAndUserIdAndDeletedFalse(recordId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("记录不存在"));
        record.setFavorite(false);
        SearchRecord saved = searchRecordRepository.save(record);
        log.info("Record after unfavoriting: {}", describeRecord(saved));
    }

    /**
     * 意图：将指定搜索记录的展示词条更新为模型返回的规范词条，确保历史记录与最终呈现内容一致。\
     * 输入：\
     *  - userId：当前用户 ID，用于权限校验与日志定位；\
     *  - recordId：需要同步的搜索记录主键；\
     *  - canonicalTerm：模型返回的规范词条，可能为空或与原始输入不同。\
     * 输出：更新后的 {@link SearchRecordResponse}，若记录不存在或规范词为空则返回 null。\
     * 流程：\
     *  1) 兜底校验 recordId 与 canonicalTerm 的可用性；\
     *  2) 查询数据库中的搜索记录，若已被删除则记录日志并退出；\
     *  3) 当规范词与现有词条不一致时执行更新并返回最新视图。\
     * 错误处理：查询不到记录时仅记录警告而不抛出，避免影响用户检索主流程。\
     * 复杂度：O(1) 数据库访问与常量级字符串处理。
     */
    @Transactional
    public SearchRecordResponse synchronizeRecordTerm(Long userId, Long recordId, String canonicalTerm) {
        if (recordId == null) {
            log.debug("Skip synchronizing search record term because recordId is null for user {}", userId);
            return null;
        }
        if (canonicalTerm == null) {
            log.debug("Skip synchronizing search record {} because canonical term is null", recordId);
            return null;
        }
        String sanitized = canonicalTerm.trim();
        if (sanitized.isEmpty()) {
            log.debug("Skip synchronizing search record {} because canonical term is blank", recordId);
            return null;
        }
        SearchRecord record = searchRecordRepository.findByIdAndUserIdAndDeletedFalse(recordId, userId).orElse(null);
        if (record == null) {
            log.warn("Search record {} for user {} not found during term synchronization", recordId, userId);
            return null;
        }
        if (!sanitized.equals(record.getTerm())) {
            record.setTerm(sanitized);
            record = searchRecordRepository.save(record);
            log.info("Synchronized search record {} for user {} to canonical term '{}'", recordId, userId, sanitized);
        }
        return searchRecordViewAssembler.assembleSingle(userId, record);
    }

    /**
     * Delete a single search record belonging to the given user.
     */
    @Transactional
    public void deleteRecord(Long userId, Long recordId) {
        log.info("Deleting search record {} for user {}", recordId, userId);
        SearchRecord record = searchRecordRepository
            .findByIdAndDeletedFalse(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
        if (!record.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("搜索记录不存在");
        }
        record.setDeleted(true);
        searchResultService.softDeleteByRecordId(record.getId());
        searchRecordRepository.save(record);
        log.info("Soft deleted search record: {}", describeRecord(record));
    }

    private String describeRecord(SearchRecord record) {
        if (record == null) {
            return "null";
        }
        Long uid = record.getUser() != null ? record.getUser().getId() : null;
        return String.format(
            "id=%d, userId=%s, term='%s', language=%s, flavor=%s, favorite=%s, createdAt=%s, deleted=%s",
            record.getId(),
            uid,
            record.getTerm(),
            record.getLanguage(),
            record.getFlavor(),
            record.getFavorite(),
            record.getCreatedAt(),
            record.getDeleted()
        );
    }

    private String describeResponse(SearchRecordResponse response) {
        if (response == null) {
            return "null";
        }
        return String.format(
            "id=%d, userId=%s, term='%s', language=%s, flavor=%s, " +
            "favorite=%s, createdAt=%s, versions=%d, latestVersion=%s",
            response.id(),
            response.userId(),
            response.term(),
            response.language(),
            response.flavor(),
            response.favorite(),
            response.createdAt(),
            response.versions().size(),
            response.latestVersion() != null ? response.latestVersion().versionNumber() : null
        );
    }
}
