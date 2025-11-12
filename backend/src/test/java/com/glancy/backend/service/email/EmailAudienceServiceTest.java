package com.glancy.backend.service.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailAudience;
import com.glancy.backend.entity.EmailStream;
import com.glancy.backend.entity.EmailSuppressionStatus;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.EmailAudienceRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EmailAudienceServiceTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2024-01-01T00:00:00Z"), ZoneOffset.UTC);

  @Mock private EmailAudienceRepository repository;

  private EmailVerificationProperties properties;
  private EmailAudienceService service;

  @BeforeEach
  void setUp() {
    properties = new EmailVerificationProperties();
    properties.setFrom("no-reply@mail.glancy.xyz");
    properties.getCompliance().setUnsubscribeMailto("unsubscribe@mail.glancy.xyz");
    properties.getStreams().setTransactionalDomain("mail.glancy.xyz");
    properties.getInfrastructure().setReverseDnsDomain("mail.glancy.xyz");
    properties.getInfrastructure().setSpfRecord("spf");
    properties.getInfrastructure().setDkimSelector("selector");
    properties.getInfrastructure().setDmarcPolicy("dmarc");
    properties.getAudiencePolicy().setInactivityThreshold(Duration.ofDays(180));
    service = new EmailAudienceService(repository, properties, FIXED_CLOCK);
  }

  /** 验证首次发送时会创建受众并记录互动时间。 */
  @Test
  void shouldCreateAudienceOnFirstSend() {
    when(repository.findByEmailAndStream("user@mail.glancy.xyz", EmailStream.TRANSACTIONAL))
        .thenReturn(Optional.empty());
    ArgumentCaptor<EmailAudience> captor = ArgumentCaptor.forClass(EmailAudience.class);
    when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    EmailAudience audience = service.ensureTransactionalConsent("user@mail.glancy.xyz");

    verify(repository, times(2)).save(captor.capture());
    assertThat(audience.getEmail()).isEqualTo("user@mail.glancy.xyz");
    assertThat(audience.getStream()).isEqualTo(EmailStream.TRANSACTIONAL);
    assertThat(captor.getValue().getLastInteractionAt())
        .isEqualTo(LocalDateTime.ofInstant(FIXED_CLOCK.instant(), FIXED_CLOCK.getZone()));
  }

  /** 验证已退订用户无法再次发送邮件。 */
  @Test
  void shouldRejectUnsubscribedAudience() {
    EmailAudience audience =
        new EmailAudience(
            "user@mail.glancy.xyz", EmailStream.TRANSACTIONAL, LocalDateTime.now(FIXED_CLOCK));
    audience.setSubscribed(false, LocalDateTime.now(FIXED_CLOCK).minusDays(1));
    when(repository.findByEmailAndStream("user@mail.glancy.xyz", EmailStream.TRANSACTIONAL))
        .thenReturn(Optional.of(audience));

    assertThatThrownBy(() -> service.ensureTransactionalConsent("user@mail.glancy.xyz"))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("退订");
  }

  /** 验证长期未互动的订阅者会被自动标记为暂停发送。 */
  @Test
  void shouldSuppressInactiveAudience() {
    EmailAudience audience =
        new EmailAudience(
            "user@mail.glancy.xyz",
            EmailStream.TRANSACTIONAL,
            LocalDateTime.now(FIXED_CLOCK).minusYears(1));
    when(repository.findByEmailAndStream("user@mail.glancy.xyz", EmailStream.TRANSACTIONAL))
        .thenReturn(Optional.of(audience));

    assertThatThrownBy(() -> service.ensureTransactionalConsent("user@mail.glancy.xyz"))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("长期未互动");
    assertThat(audience.getSubscribed()).isFalse();
  }

  /** 验证累计软退信到达阈值后会切换为软退订状态。 */
  @Test
  void shouldSuppressWhenSoftBounceThresholdExceeded() {
    EmailAudience audience =
        new EmailAudience(
            "user@mail.glancy.xyz", EmailStream.TRANSACTIONAL, LocalDateTime.now(FIXED_CLOCK));
    when(repository.findByEmailAndStream("user@mail.glancy.xyz", EmailStream.TRANSACTIONAL))
        .thenReturn(Optional.of(audience));
    properties.getAudiencePolicy().setSoftBounceSuppressionThreshold(1);

    service.recordDeliveryFailure(
        "user@mail.glancy.xyz",
        EmailStream.TRANSACTIONAL,
        new EmailDeliveryFailure(false, EmailSuppressionStatus.SOFT_BOUNCE, "421", "Mailbox full"),
        LocalDateTime.now(FIXED_CLOCK));

    assertThat(audience.getSuppressionStatus()).isEqualTo(EmailSuppressionStatus.SOFT_BOUNCE);
  }
}
