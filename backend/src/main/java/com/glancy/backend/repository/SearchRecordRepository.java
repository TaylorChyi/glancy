package com.glancy.backend.repository;

import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for persisting and querying user search history.
 */
@Repository
public interface SearchRecordRepository extends JpaRepository<SearchRecord, Long> {
    List<SearchRecord> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndDeletedFalseAndCreatedAtBetween(
        Long userId,
        LocalDateTime start,
        LocalDateTime end
    );

    Optional<SearchRecord> findTopByUserIdAndTermAndLanguageAndDeletedFalseOrderByCreatedAtDesc(
        Long userId,
        String term,
        Language language
    );

    Optional<SearchRecord> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);

    Optional<SearchRecord> findByIdAndDeletedFalse(Long id);
}
