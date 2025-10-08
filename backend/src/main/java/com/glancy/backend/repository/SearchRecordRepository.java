package com.glancy.backend.repository;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for persisting and querying user search history.
 */
@Repository
public interface SearchRecordRepository extends JpaRepository<SearchRecord, Long> {
    List<SearchRecord> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    List<SearchRecord> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndDeletedFalseAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    boolean existsByUserIdAndTermAndLanguageAndFlavorAndDeletedFalse(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor
    );

    SearchRecord findTopByUserIdAndTermAndLanguageAndFlavorAndDeletedFalseOrderByCreatedAtDesc(
        Long userId,
        String term,
        Language language,
        DictionaryFlavor flavor
    );

    @Query(
        "SELECT r FROM SearchRecord r " +
        "WHERE r.deleted = false " +
        "AND r.user.id = :userId " +
        "AND r.language = :language " +
        "AND r.flavor = :flavor " +
        "AND LOWER(TRIM(r.term)) = :normalizedTerm"
    )
    List<SearchRecord> findByUserIdAndNormalizedTerm(
        @Param("userId") Long userId,
        @Param("normalizedTerm") String normalizedTerm,
        @Param("language") Language language,
        @Param("flavor") DictionaryFlavor flavor,
        Pageable pageable
    );

    java.util.Optional<SearchRecord> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);

    java.util.Optional<SearchRecord> findByIdAndDeletedFalse(Long id);

    List<SearchRecord> findByUserIdAndDeletedFalse(Long userId);
}
