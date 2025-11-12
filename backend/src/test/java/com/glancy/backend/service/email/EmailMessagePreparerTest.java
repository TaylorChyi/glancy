package com.glancy.backend.service.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.entity.EmailStream;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Properties;
import org.junit.jupiter.api.Test;

class EmailMessagePreparerTest {

  /** 验证在配置事务域名后，预处理能够为待发送邮件补全符合域名策略的 Message-ID，确保向 iCloud 等提供商投递成功。 */
  @Test
  void prepareShouldInjectMessageIdWhenMissing() throws Exception {
    EmailVerificationProperties properties = new EmailVerificationProperties();
    properties.setFrom("no-reply@mail.glancy.xyz");
    properties.getStreams().setTransactionalDomain("mail.glancy.xyz");

    Clock clock = Clock.fixed(Instant.parse("2024-03-15T08:00:00Z"), ZoneOffset.UTC);
    MessageIdGenerator generator = new MessageIdGenerator(clock);
    EmailMessagePreparer preparer = new EmailMessagePreparer(properties, generator);

    MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
    preparer.prepare(message, EmailStream.TRANSACTIONAL);

    String messageId = message.getHeader("Message-ID", null);
    assertNotNull(messageId);
    assertTrue(messageId.startsWith("<20240315080000000."));
    assertTrue(messageId.endsWith("@mail.glancy.xyz>"));
  }

  /** 验证当邮件已具备 Message-ID 时，预处理不会篡改调用方设置的头部，避免重复写入。 */
  @Test
  void prepareShouldRespectExistingMessageId() throws Exception {
    EmailVerificationProperties properties = new EmailVerificationProperties();
    properties.getStreams().setTransactionalDomain("mail.glancy.xyz");

    Clock clock = Clock.fixed(Instant.parse("2024-05-01T00:00:00Z"), ZoneOffset.UTC);
    MessageIdGenerator generator = new MessageIdGenerator(clock);
    EmailMessagePreparer preparer = new EmailMessagePreparer(properties, generator);

    MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
    message.setHeader("Message-ID", "<custom@domain>");
    preparer.prepare(message, EmailStream.TRANSACTIONAL);

    assertEquals("<custom@domain>", message.getHeader("Message-ID", null));
  }

  /** 验证当缺失事务域名且发件人非法时，预处理不会抛出异常也不会写入无效 Message-ID。 */
  @Test
  void prepareShouldSkipWhenDomainMissing() throws Exception {
    EmailVerificationProperties properties = new EmailVerificationProperties();
    properties.setFrom("invalid-address");

    Clock clock = Clock.fixed(Instant.parse("2024-05-01T00:00:00Z"), ZoneOffset.UTC);
    MessageIdGenerator generator = new MessageIdGenerator(clock);
    EmailMessagePreparer preparer = new EmailMessagePreparer(properties, generator);

    MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
    preparer.prepare(message, EmailStream.TRANSACTIONAL);

    assertNull(message.getHeader("Message-ID", null));
  }
}
