package com.glancy.backend.repository;

import com.glancy.backend.entity.GomemoSessionWord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GomemoSessionWordRepository extends JpaRepository<GomemoSessionWord, Long> {
    List<GomemoSessionWord> findBySessionIdAndDeletedFalseOrderByPriorityScoreDesc(Long sessionId);

    Optional<GomemoSessionWord> findTopBySessionIdAndTermAndDeletedFalse(Long sessionId, String term);
}
