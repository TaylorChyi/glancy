package com.glancy.backend.repository;

import com.glancy.backend.entity.TtsAudio;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for cached TTS audio metadata.
 */
@Repository
public interface TtsAudioRepository extends JpaRepository<TtsAudio, Long> {
    Optional<TtsAudio> findByHashKey(String hashKey);
}
