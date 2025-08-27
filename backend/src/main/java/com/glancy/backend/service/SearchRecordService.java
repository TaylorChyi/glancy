package com.glancy.backend.service;

import com.glancy.backend.config.SearchProperties;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.mapper.SearchRecordMapper;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Manages persistence of search records and enforces daily limits for non-member users. */
@Slf4j
@Service
public class SearchRecordService {

  private final SearchRecordRepository searchRecordRepository;
  private final UserRepository userRepository;
  private final SearchRecordMapper searchRecordMapper;
  private final int nonMemberSearchLimit;

  public SearchRecordService(
      SearchRecordRepository searchRecordRepository,
      UserRepository userRepository,
      SearchProperties properties,
      SearchRecordMapper searchRecordMapper) {
    this.searchRecordRepository = searchRecordRepository;
    this.userRepository = userRepository;
    this.searchRecordMapper = searchRecordMapper;
    this.nonMemberSearchLimit = properties.getLimit().getNonMember();
  }

  /** Save a search record for a user and apply daily limits if the user is not a member. */
  @Transactional
  public SearchRecordResponse saveRecord(Long userId, SearchRecordRequest request) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(
                () -> {
                  log.warn("User with id {} not found", userId);
                  return new ResourceNotFoundException("用户不存在");
                });
    if (user.getLastLoginAt() == null) {
      log.warn("User {} is not logged in", userId);
      throw new InvalidRequestException("用户未登录");
    }
    SearchRecord existing =
        searchRecordRepository.findTopByUserIdAndTermAndLanguageOrderByCreatedAtDesc(
            userId, request.getTerm(), request.getLanguage());
    if (existing != null) {
      existing.setCreatedAt(LocalDateTime.now());
      SearchRecord updated = searchRecordRepository.save(existing);
      SearchRecordResponse response = searchRecordMapper.toResponse(updated);
      return response;
    }

    if (Boolean.FALSE.equals(user.getMember())) {
      LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
      LocalDateTime endOfDay = startOfDay.plusDays(1);
      long count =
          searchRecordRepository.countByUserIdAndCreatedAtBetween(userId, startOfDay, endOfDay);
      if (count >= nonMemberSearchLimit) {
        log.warn("User {} exceeded daily search limit", userId);
        throw new InvalidRequestException("非会员每天只能搜索" + nonMemberSearchLimit + "次");
      }
    }
    SearchRecord record = new SearchRecord();
    record.setUser(user);
    record.setTerm(request.getTerm());
    record.setLanguage(request.getLanguage());
    SearchRecord saved = searchRecordRepository.save(record);
    SearchRecordResponse response = searchRecordMapper.toResponse(saved);
    return response;
  }

  /** Mark a search record as favorite for the user. */
  @Transactional
  public SearchRecordResponse favoriteRecord(Long userId, Long recordId) {
    SearchRecord record =
        searchRecordRepository
            .findByIdAndUserId(recordId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
    record.setFavorite(true);
    SearchRecord saved = searchRecordRepository.save(record);
    SearchRecordResponse response = searchRecordMapper.toResponse(saved);
    return response;
  }

  /** Retrieve a user's search history ordered by creation time. */
  @Transactional(readOnly = true)
  public List<SearchRecordResponse> getRecords(Long userId) {
    List<SearchRecord> records = searchRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
    records.forEach(r -> log.debug("Fetched record: {}", describeRecord(r)));
    List<SearchRecordResponse> responses =
        records.stream().map(searchRecordMapper::toResponse).collect(Collectors.toList());
    responses.forEach(r -> log.debug("Record response: {}", describeResponse(r)));
    return responses;
  }

  /** Remove all search records for the given user. */
  @Transactional
  public void clearRecords(Long userId) {
    List<SearchRecord> records = searchRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
    searchRecordRepository.deleteByUserId(userId);
  }

  /** Cancel favorite status for a user's search record. */
  @Transactional
  public void unfavoriteRecord(Long userId, Long recordId) {
    SearchRecord record =
        searchRecordRepository
            .findByIdAndUserId(recordId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("记录不存在"));
    record.setFavorite(false);
    SearchRecord saved = searchRecordRepository.save(record);
  }

  /** Delete a single search record belonging to the given user. */
  @Transactional
  public void deleteRecord(Long userId, Long recordId) {
    SearchRecord record =
        searchRecordRepository
            .findById(recordId)
            .orElseThrow(() -> new ResourceNotFoundException("搜索记录不存在"));
    if (!record.getUser().getId().equals(userId)) {
      throw new ResourceNotFoundException("搜索记录不存在");
    }
    searchRecordRepository.delete(record);
  }

  private String describeRecord(SearchRecord record) {
    if (record == null) {
      return "null";
    }
    Long uid = record.getUser() != null ? record.getUser().getId() : null;
    return String.format(
        "id=%d, userId=%s, term='%s', language=%s, favorite=%s, createdAt=%s",
        record.getId(),
        uid,
        record.getTerm(),
        record.getLanguage(),
        record.getFavorite(),
        record.getCreatedAt());
  }

  private String describeResponse(SearchRecordResponse response) {
    if (response == null) {
      return "null";
    }
    return String.format(
        "id=%d, userId=%s, term='%s', language=%s, favorite=%s, createdAt=%s",
        response.getId(),
        response.getUserId(),
        response.getTerm(),
        response.getLanguage(),
        response.getFavorite(),
        response.getCreatedAt());
  }
}
