package com.glancy.backend.service.tts.quota;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.glancy.backend.entity.TtsUsage;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.QuotaExceededException;
import com.glancy.backend.repository.TtsUsageRepository;
import com.glancy.backend.service.tts.config.TtsConfig;
import com.glancy.backend.service.tts.config.TtsConfigManager;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

/**
 * Tests for {@link TtsQuotaService}. These ensure that daily usage
 * limits are enforced and persisted correctly.
 */
class TtsQuotaServiceTest {

    @Mock
    private TtsUsageRepository usageRepository;

    @Mock
    private TtsConfigManager configManager;

    private Clock clock;

    private TtsQuotaService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        clock = Clock.fixed(Instant.parse("2024-01-02T00:00:00Z"), ZoneOffset.UTC);
        service = new TtsQuotaService(usageRepository, configManager, clock);

        TtsConfig cfg = new TtsConfig();
        TtsConfig.Quota quota = new TtsConfig.Quota();
        TtsConfig.Quota.Daily daily = new TtsConfig.Quota.Daily();
        daily.setPro(100);
        daily.setFree(5);
        quota.setDaily(daily);
        cfg.setQuota(quota);
        when(configManager.current()).thenReturn(cfg);
    }

    /**
     * verifyQuota should reject requests once the user reaches their limit.
     */
    @Test
    void verifyQuotaRejectsWhenLimitReached() {
        User user = new User();
        user.setId(1L);
        user.setMember(false);
        TtsUsage usage = new TtsUsage();
        usage.setCount(5);
        when(usageRepository.findByUserIdAndDate(eq(1L), any(LocalDate.class))).thenReturn(Optional.of(usage));

        assertThrows(QuotaExceededException.class, () -> service.verifyQuota(user));
    }

    /**
     * recordUsage should increment the existing counter.
     */
    @Test
    void recordUsageIncrementsCount() {
        User user = new User();
        user.setId(1L);
        user.setMember(true);
        TtsUsage usage = new TtsUsage();
        usage.setUser(user);
        usage.setDate(LocalDate.of(2024, 1, 2));
        usage.setCount(1);
        when(usageRepository.findByUserIdAndDate(eq(1L), any(LocalDate.class))).thenReturn(Optional.of(usage));
        when(usageRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.recordUsage(user);

        ArgumentCaptor<TtsUsage> captor = ArgumentCaptor.forClass(TtsUsage.class);
        verify(usageRepository).save(captor.capture());
        assertEquals(2, captor.getValue().getCount());
    }
}
