package com.glancy.backend.repository;

import com.glancy.backend.entity.GomemoProgress;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GomemoProgressRepository extends JpaRepository<GomemoProgress, Long> {
    List<GomemoProgress> findBySessionIdAndDeletedFalse(Long sessionId);

    List<GomemoProgress> findBySessionIdAndTermAndDeletedFalse(Long sessionId, String term);
}
