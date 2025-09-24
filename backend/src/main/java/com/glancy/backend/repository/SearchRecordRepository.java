package com.glancy.backend.repository;

import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for persisting and querying user search history.
 */
@Repository
public interface SearchRecordRepository extends JpaRepository<SearchRecord, Long> {
    List<SearchRecord> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    List<SearchRecord> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndDeletedFalseAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    boolean existsByUserIdAndTermAndLanguageAndDeletedFalse(Long userId, String term, Language language);

    SearchRecord findTopByUserIdAndTermAndLanguageAndDeletedFalseOrderByCreatedAtDesc(
        Long userId,
        String term,
        Language language
    );

    java.util.Optional<SearchRecord> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);

    java.util.Optional<SearchRecord> findByIdAndDeletedFalse(Long id);

    List<SearchRecord> findByUserIdAndDeletedFalse(Long userId);
}
