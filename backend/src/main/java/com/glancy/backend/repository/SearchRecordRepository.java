package com.glancy.backend.repository;

import com.glancy.backend.entity.DictionaryFlavor;
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
    List<SearchRecord> findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(Long userId);

    List<SearchRecord> findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(Long userId, Pageable pageable);

    List<SearchRecord> findByUserIdAndLanguageAndFlavorAndDeletedFalseOrderByUpdatedAtDesc(
        Long userId,
        Language language,
        DictionaryFlavor flavor,
        Pageable pageable
    );

    long countByUserIdAndDeletedFalseAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    boolean existsByUserIdAndTermAndLanguageAndFlavorAndDeletedFalse(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor
    );

    SearchRecord findTopByUserIdAndTermAndLanguageAndFlavorAndDeletedFalseOrderByUpdatedAtDesc(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor
    );

    java.util.Optional<SearchRecord> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);

    java.util.Optional<SearchRecord> findByIdAndDeletedFalse(Long id);

    List<SearchRecord> findByUserIdAndDeletedFalse(Long userId);
}
