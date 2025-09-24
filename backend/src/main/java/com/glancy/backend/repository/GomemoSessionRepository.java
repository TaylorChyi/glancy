package com.glancy.backend.repository;

import com.glancy.backend.entity.GomemoSession;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GomemoSessionRepository extends JpaRepository<GomemoSession, Long> {
    Optional<GomemoSession> findTopByUserIdAndSessionDateAndDeletedFalse(Long userId, LocalDate sessionDate);

    List<GomemoSession> findByUserIdAndDeletedFalseOrderBySessionDateDesc(Long userId);
}
