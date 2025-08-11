package com.glancy.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Metadata for a synthesised audio file. The binary payload lives in
 * object storage while this entity captures information required for
 * cache lookups and expiry management.
 */
@Entity
@Table(name = "tts_audio", uniqueConstraints = @UniqueConstraint(columnNames = "hash_key"))
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TtsAudio extends BaseEntity {

    @Column(name = "hash_key", nullable = false, length = 64)
    private String hashKey;

    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(nullable = false, length = 10)
    private String lang;

    @Column(name = "voice_id", nullable = false)
    private String voiceId;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TtsScope scope;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;
}
