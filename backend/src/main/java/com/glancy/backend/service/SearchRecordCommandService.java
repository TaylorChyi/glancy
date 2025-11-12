package com.glancy.backend.service;

import com.glancy.backend.config.SearchProperties;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import com.glancy.backend.service.support.SearchRecordLogFormatter;
import com.glancy.backend.service.support.SearchRecordViewAssembler;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
class SearchRecordCommandService {

    private static final int NORMALIZED_LOOKBACK_LIMIT = 20;
    private static final Sort UPDATED_AT_DESC = Sort.by(Sort.Direction.DESC, "updatedAt");

    private final SearchRecordRepository searchRecordRepository;
    private final UserRepository userRepository;
    private final SearchResultService searchResultService;
    private final SearchRecordViewAssembler viewAssembler;
    private final DictionaryTermNormalizer termNormalizer;
    private final Clock clock;
    private final SearchProperties properties;

    SearchRecordResponse saveRecord(Long userId, SearchRecordRequest request) {
        log.info("Saving search record for user {} with term '{}'", userId, request.getTerm());
        User user = loadUser(userId);
        ensureUserLoggedIn(userId, user);

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
            return refreshExistingRecord(userId, existing);
        }

        enforceDailyLimit(user);
        return persistNewRecord(userId, user, request, flavor);
    }

    SearchRecordResponse favoriteRecord(Long userId, Long recordId) {
        log.info("Favoriting search record {} for user {}", recordId, userId);
        SearchRecord record = searchRecordRepository
            .findByIdAndUserIdAndDeletedFalse(recordId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
        record.setFavorite(true);
        SearchRecord saved = searchRecordRepository.save(record);
        log.info("Record after favoriting: {}", SearchRecordLogFormatter.record(saved));
        SearchRecordResponse response = viewAssembler.assembleSingle(userId, saved);
        log.info("Favorite response: {}", SearchRecordLogFormatter.response(response));
        return response;
    }

    void clearRecords(Long userId) {
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

    void unfavoriteRecord(Long userId, Long recordId) {
        log.info("Unfavoriting search record {} for user {}", recordId, userId);
        SearchRecord record = searchRecordRepository
            .findByIdAndUserIdAndDeletedFalse(recordId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("记录不存在"));
        record.setFavorite(false);
        SearchRecord saved = searchRecordRepository.save(record);
        log.info("Record after unfavoriting: {}", SearchRecordLogFormatter.record(saved));
    }

    SearchRecordResponse synchronizeRecordTerm(Long userId, Long recordId, String canonicalTerm) {
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
        return viewAssembler.assembleSingle(userId, record);
    }

    void deleteRecord(Long userId, Long recordId) {
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
        log.info("Soft deleted search record: {}", SearchRecordLogFormatter.record(record));
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    private void ensureUserLoggedIn(Long userId, User user) {
        if (user.getLastLoginAt() == null) {
            log.warn("User {} is not logged in", userId);
            throw new InvalidRequestException("用户未登录");
        }
    }

    private SearchRecordResponse refreshExistingRecord(Long userId, SearchRecord existing) {
        log.info("Existing record found: {}", SearchRecordLogFormatter.record(existing));
        existing.setUpdatedAt(LocalDateTime.now(clock));
        SearchRecord updated = searchRecordRepository.save(existing);
        log.info("Updated record persisted: {}", SearchRecordLogFormatter.record(updated));
        SearchRecordResponse response = viewAssembler.assembleSingle(userId, updated);
        log.info("Returning record response: {}", SearchRecordLogFormatter.response(response));
        return response;
    }

    private SearchRecordResponse persistNewRecord(
        Long userId,
        User user,
        SearchRecordRequest request,
        DictionaryFlavor flavor
    ) {
        SearchRecord record = new SearchRecord();
        record.setUser(user);
        record.setTerm(request.getTerm());
        record.setLanguage(request.getLanguage());
        record.setFlavor(flavor);
        SearchRecord saved = searchRecordRepository.save(record);
        log.info("Persisted new search record: {}", SearchRecordLogFormatter.record(saved));
        SearchRecordResponse response = viewAssembler.assembleSingle(userId, saved);
        log.info("Returning record response: {}", SearchRecordLogFormatter.response(response));
        return response;
    }

    private void enforceDailyLimit(User user) {
        if (!user.hasActiveMembershipAt(LocalDateTime.now(clock))) {
            LocalDateTime startOfDay = LocalDate.now(clock).atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);
            long count = searchRecordRepository.countByUserIdAndDeletedFalseAndCreatedAtBetween(
                user.getId(),
                startOfDay,
                endOfDay
            );
            int limit = properties.getLimit().getNonMember();
            if (count >= limit) {
                log.warn("User {} exceeded daily search limit", user.getId());
                throw new InvalidRequestException("非会员每天只能搜索" + limit + "次");
            }
        }
    }

    private SearchRecord findExistingRecord(
        Long userId,
        String rawTerm,
        String normalizedTerm,
        Language language,
        DictionaryFlavor flavor
    ) {
        if (normalizedTerm != null && !normalizedTerm.isBlank()) {
            Pageable newestRecords = PageRequest.of(0, NORMALIZED_LOOKBACK_LIMIT, UPDATED_AT_DESC);
            return searchRecordRepository
                .findByUserIdAndLanguageAndFlavorAndDeletedFalseOrderByUpdatedAtDesc(
                    userId,
                    language,
                    flavor,
                    newestRecords
                )
                .stream()
                .filter(candidate -> normalizedTerm.equals(termNormalizer.normalize(candidate.getTerm())))
                .findFirst()
                .orElse(null);
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
}
