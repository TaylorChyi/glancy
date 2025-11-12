package com.glancy.backend.service;

import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.service.support.SearchRecordLogFormatter;
import com.glancy.backend.service.support.SearchRecordPageRequest;
import com.glancy.backend.service.support.SearchRecordViewAssembler;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
class SearchRecordQueryService {

  private static final Sort UPDATED_AT_DESC = Sort.by(Sort.Direction.DESC, "updatedAt");

  private final SearchRecordRepository searchRecordRepository;
  private final SearchRecordViewAssembler viewAssembler;

  List<SearchRecordResponse> getRecords(Long userId, SearchRecordPageRequest pageRequest) {
    Pageable pageable = pageRequest.toPageable(UPDATED_AT_DESC);
    log.info(
        "Fetching search records for user {} with page {} and size {}",
        userId,
        pageRequest.page(),
        pageRequest.size());
    List<SearchRecord> records =
        searchRecordRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(userId, pageable);
    log.info("Retrieved {} records from database for user {}", records.size(), userId);
    records.forEach(r -> log.debug("Fetched record: {}", SearchRecordLogFormatter.record(r)));
    return viewAssembler.assemble(userId, records).stream()
        .peek(
            response ->
                log.debug("Record response: {}", SearchRecordLogFormatter.response(response)))
        .toList();
  }
}
