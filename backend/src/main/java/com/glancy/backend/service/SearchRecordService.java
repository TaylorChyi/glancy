package com.glancy.backend.service;

import com.glancy.backend.config.SearchProperties;
import com.glancy.backend.dto.search.SearchRecordRequest;
import com.glancy.backend.dto.search.SearchRecordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import com.glancy.backend.service.support.SearchRecordPageRequest;
import com.glancy.backend.service.support.SearchRecordViewAssembler;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
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

    // 归一化查找仅需最近若干条记录即可避免全表扫描，20 条覆盖常见短期重复查询场景且便于未来通过配置调整。
    private static final int NORMALIZED_LOOKBACK_LIMIT = 20;

    // 通过 updatedAt 维持时间序，因 createdAt 列开启 updatable=false，不可在重用记录时重置创建时间。
    private static final Sort UPDATED_AT_DESC = Sort.by(Sort.Direction.DESC, "updatedAt");

    private final SearchRecordRepository searchRecordRepository;
    private final UserRepository userRepository;
    private final SearchResultService searchResultService;
    private final SearchRecordViewAssembler searchRecordViewAssembler;
    private final int nonMemberSearchLimit;
    private final DictionaryTermNormalizer termNormalizer;
    private final Clock clock;

    public SearchRecordService(
        SearchRecordRepository searchRecordRepository,
        UserRepository userRepository,
        SearchProperties properties,
        SearchResultService searchResultService,
        SearchRecordViewAssembler searchRecordViewAssembler,
        DictionaryTermNormalizer termNormalizer,
        Clock clock
    ) {
        this.searchRecordRepository = searchRecordRepository;
        this.userRepository = userRepository;
        this.searchResultService = searchResultService;
        this.searchRecordViewAssembler = searchRecordViewAssembler;
        this.nonMemberSearchLimit = properties.getLimit().getNonMember();
        this.termNormalizer = termNormalizer;
        this.clock = clock;
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
        String normalizedTerm = termNormalizer.normalize(request.getTerm());
        SearchRecord existing = findExistingRecord(
            userId,
            request.getTerm(),
            normalizedTerm,
            request.getLanguage(),
            flavor
        );
        if (existing != null) {
            log.info("Existing record found: {}", describeRecord(existing));
            // 通过显式刷新更新时间触发 JPA 更新钩子，确保历史列表按最近访问排序。
            existing.setUpdatedAt(LocalDateTime.now(clock));
            // 将刷新后的时间写回数据库，使最新访问立即生效。
            SearchRecord updated = searchRecordRepository.save(existing);
            log.info("Updated record persisted: {}", describeRecord(updated));
            SearchRecordResponse response = searchRecordViewAssembler.assembleSingle(userId, updated);
            log.info("Returning record response: {}", describeResponse(response));
            return response;
        }

        if (!user.hasActiveMembershipAt(LocalDateTime.now(clock))) {
            LocalDateTime startOfDay = LocalDate.now(clock).atStartOfDay();
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
     * 意图：通过共享的词条归一化策略在保存前复用已有搜索记录，避免因大小写或空白差异产生重复历史。\
     * 输入：\
     *  - userId：当前用户；\
     *  - rawTerm：请求中的原始词条；\
     *  - normalizedTerm：归一化后的词条；\
     *  - language/flavor：查询维度。\
     * 输出：若找到匹配记录则返回该记录，否则返回 null。\
     * 流程：\
     *  1) 从最近记录中按归一化策略查找；\
     *  2) 若未命中且原始词条可用，则回退到精确匹配。\
     * 错误处理：无显式异常，数据库访问异常由上层捕获。\
     * 复杂度：O(1)。
     */
    private SearchRecord findExistingRecord(
        Long userId,
        String rawTerm,
        String normalizedTerm,
        Language language,
        DictionaryFlavor flavor
    ) {
        if (normalizedTerm != null && !normalizedTerm.isBlank()) {
            Pageable newestRecords = PageRequest.of(0, NORMALIZED_LOOKBACK_LIMIT, UPDATED_AT_DESC);
            Optional<SearchRecord> normalizedMatch = searchRecordRepository
                .findByUserIdAndLanguageAndFlavorAndDeletedFalseOrderByUpdatedAtDesc(
                    userId,
                    language,
                    flavor,
                    newestRecords
                )
                .stream()
                // 采用与请求相同的归一化策略进行对比，确保数据库中的历史词条与缓存键一致。
                .filter(candidate -> normalizedTerm.equals(termNormalizer.normalize(candidate.getTerm())))
                .findFirst();
            if (normalizedMatch.isPresent()) {
                return normalizedMatch.get();
            }
        }
        if (rawTerm == null || rawTerm.isBlank()) {
            return null;
        }
        return searchRecordRepository.findTopByUserIdAndTermAndLanguageAndFlavorAndDeletedFalseOrderByUpdatedAtDesc(
            userId,
            rawTerm,
            language,
            flavor
        );
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
        Pageable pageable = pageRequest.toPageable(UPDATED_AT_DESC);
        log.info(
            "Fetching search records for user {} with page {} and size {}",
            userId,
            pageRequest.page(),
            pageRequest.size()
        );
        List<SearchRecord> records = searchRecordRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(
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
            "id=%d, userId=%s, term='%s', language=%s, flavor=%s, createdAt=%s, deleted=%s",
            record.getId(),
            uid,
            record.getTerm(),
            record.getLanguage(),
            record.getFlavor(),
            record.getCreatedAt(),
            record.getDeleted()
        );
    }

    private String describeResponse(SearchRecordResponse response) {
        if (response == null) {
            return "null";
        }
        return String.format(
            "id=%d, userId=%s, term='%s', language=%s, flavor=%s, " + "createdAt=%s, versions=%d, latestVersion=%s",
            response.id(),
            response.userId(),
            response.term(),
            response.language(),
            response.flavor(),
            response.createdAt(),
            response.versions().size(),
            response.latestVersion() != null ? response.latestVersion().versionNumber() : null
        );
    }
}
