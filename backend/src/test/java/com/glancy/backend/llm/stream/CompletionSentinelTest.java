package com.glancy.backend.llm.stream;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

/**
 * 针对 CompletionSentinel 的单元测试，确保哨兵检测与剥离逻辑稳定。
 */
class CompletionSentinelTest {

    /**
     * 测试目标：验证末尾带换行的哨兵行会被识别且正文换行得以保留。
     * 前置条件：提供包含正文、换行、哨兵及终止换行的内容。
     * 步骤：
     *  1) 调用 inspect 分析文本；
     *  2) 获取 CompletionCheck 标记。
     * 断言：
     *  - satisfied 为 true；
     *  - sanitizedContent 等于原文去除哨兵后的字符串，并保留换行。
     * 边界/异常：
     *  - 无额外边界验证。
     */
    @Test
    void inspectDetectsSentinelAndKeepsWhitespace() {
        String content = "# 单词\n<END>\n";
        CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect(content);
        assertTrue(check.satisfied());
        assertEquals("# 单词\n", check.sanitizedContent());
    }

    /**
     * 测试目标：验证缺少哨兵时返回原文，确保无意外改写。
     * 前置条件：提供不包含哨兵的正文文本。
     * 步骤：
     *  1) 调用 inspect 分析文本；
     *  2) 检查返回结果。
     * 断言：
     *  - satisfied 为 false；
     *  - sanitizedContent 与输入完全一致。
     * 边界/异常：
     *  - 无额外边界验证。
     */
    @Test
    void inspectKeepsContentWhenSentinelMissing() {
        String content = "# 单词";
        CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect(content);
        assertFalse(check.satisfied());
        assertEquals(content, check.sanitizedContent());
    }

    /**
     * 测试目标：验证空内容不会触发哨兵且返回空值，避免 NPE。
     * 前置条件：输入 null。
     * 步骤：
     *  1) 调用 inspect；
     * 断言：
     *  - satisfied 为 false；
     *  - sanitizedContent 为 null。
     * 边界/异常：
     *  - 覆盖空指针边界。
     */
    @Test
    void inspectHandlesNullContent() {
        CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect(null);
        assertFalse(check.satisfied());
        assertNull(check.sanitizedContent());
    }

    /**
     * 测试目标：验证正文中的空格在哨兵剥离后依旧存在。
     * 前置条件：正文末尾包含双空格和换行，哨兵独占最后一行。
     * 步骤：
     *  1) 调用 inspect 分析文本；
     *  2) 检查 sanitizedContent。
     * 断言：
     *  - 哨兵被识别；
     *  - 保留末行双空格。
     * 边界/异常：
     *  - 验证空白字符保留。
     */
    @Test
    void inspectPreservesTrailingSpacesBeforeSentinel() {
        String content = "释义行  \n<END>";
        CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect(content);
        assertTrue(check.satisfied());
        assertEquals("释义行  \n", check.sanitizedContent());
    }

    /**
     * 测试目标：验证哨兵后若跟随正文字符则视为未完成，避免误剥离。
     * 前置条件：构造哨兵后仍有额外文本的字符串。
     * 步骤：
     *  1) 调用 inspect 分析文本；
     * 断言：
     *  - satisfied 为 false；
     *  - sanitizedContent 维持原文。
     * 边界/异常：
     *  - 覆盖异常输入路径。
     */
    @Test
    void inspectRejectsMarkerWithTrailingCharacters() {
        String content = "内容\n<END>后缀";
        CompletionSentinel.CompletionCheck check = CompletionSentinel.inspect(content);
        assertFalse(check.satisfied());
        assertEquals(content, check.sanitizedContent());
    }
}
