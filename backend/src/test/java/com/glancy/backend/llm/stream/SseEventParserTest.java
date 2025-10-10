package com.glancy.backend.llm.stream;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Optional;
import org.junit.jupiter.api.Test;

/**
 * SseEventParser 解析行为测试。
 */
class SseEventParserTest {

    private final SseEventParser parser = new SseEventParser();

    /**
     * 测试目标：验证标准的 message 事件能够解析出数据内容并默认 event=message。
     * 前置条件：输入包含 event 与 data 字段，数据为单行 JSON。
     * 步骤：调用 parse 获取 Optional。
     * 断言：返回值存在且 event=message，data 与原始 payload 一致。
     * 边界/异常：覆盖常规单行场景。
     */
    @Test
    void parseMessageEvent() {
        String raw = "event: message\ndata: {\"foo\":1}\n\n";
        Optional<SseEventParser.SseEvent> result = parser.parse(raw);
        assertTrue(result.isPresent(), "expected event to be parsed");
        SseEventParser.SseEvent event = result.get();
        assertEquals("message", event.event());
        assertEquals("{\"foo\":1}", event.data());
    }

    /**
     * 测试目标：验证空白字符串直接返回 Optional.empty()。
     * 前置条件：输入为空字符串。
     * 步骤：调用 parse。
     * 断言：返回 Optional.empty()。
     * 边界/异常：覆盖空输入容错路径。
     */
    @Test
    void parseBlankReturnsEmpty() {
        assertTrue(parser.parse("\n\n").isEmpty());
    }

    /**
     * 测试目标：验证多行 data 字段可正确合并，event 默认 message。
     * 前置条件：输入含两行 data 字段。
     * 步骤：调用 parse。
     * 断言：event=message，data 按换行拼接。
     * 边界/异常：覆盖多行数据场景。
     */
    @Test
    void parseMultiLineData() {
        String raw = "data: foo\ndata: bar\n\n";
        Optional<SseEventParser.SseEvent> result = parser.parse(raw);
        assertTrue(result.isPresent());
        SseEventParser.SseEvent event = result.get();
        assertEquals("message", event.event());
        assertEquals("foo\nbar", event.data());
    }
}
