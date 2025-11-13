package com.glancy.backend.service.email;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

class MessageIdGeneratorTest {

    private static final Pattern MESSAGE_ID_PATTERN = Pattern.compile("^<\\w+\\.\\w+@mail\\.glancy\\.xyz>$");

    /** 验证生成的 Message-ID 始终包含事务域名并保持高熵唯一性，避免被严格邮箱提供商判定为伪造邮件头。 */
    @Test
    void generateShouldProduceScopedUniqueMessageIds() {
        Clock clock = Clock.fixed(Instant.parse("2024-01-01T10:15:30Z"), ZoneOffset.UTC);
        MessageIdGenerator generator = new MessageIdGenerator(clock);

        String first = generator.generate("MAIL.GLANCY.XYZ");
        String second = generator.generate(" mail.glancy.xyz ");

        assertTrue(MESSAGE_ID_PATTERN.matcher(first).matches());
        assertTrue(MESSAGE_ID_PATTERN.matcher(second).matches());
        assertNotEquals(first, second);
        assertFalse(first.equalsIgnoreCase("<20240101101530000@MAIL.GLANCY.XYZ>"));
    }
}
