package com.glancy.backend.repository;

import com.glancy.backend.entity.TtsUsage;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for tracking per-user daily TTS usage counts.
 */
@Repository
public interface TtsUsageRepository extends JpaRepository<TtsUsage, Long> {
    Optional<TtsUsage> findByUserIdAndDate(Long userId, LocalDate date);
}
