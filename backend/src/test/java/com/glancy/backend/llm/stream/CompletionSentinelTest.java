package com.glancy.backend.llm.stream;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

/**
 * 针对 CompletionSentinel 的单元测试，确保哨兵检测与剥离逻辑稳定。
 */
class CompletionSentinelTest {

    /** 验证带尾随换行的内容会识别哨兵并剥离。 */
    @Test
    void inspectDetectsSentinelAndSanitizes() {
        String content = "# 单词\n<END>\n";
        CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect(content);
        assertTrue(check.satisfied());
        assertEquals("# 单词", check.sanitizedContent());
    }

    /** 验证缺失哨兵时保持原文不变。 */
    @Test
    void inspectKeepsContentWhenSentinelMissing() {
        String content = "# 单词";
        CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect(content);
        assertFalse(check.satisfied());
        assertEquals(content, check.sanitizedContent());
    }

    /** 验证空内容时返回未满足状态。 */
    @Test
    void inspectHandlesNullContent() {
        CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect(null);
        assertFalse(check.satisfied());
        assertNull(check.sanitizedContent());
    }
}
