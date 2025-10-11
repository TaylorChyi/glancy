package com.glancy.backend.llm.stream.transform;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.llm.stream.doubao.DoubaoContentExtractor;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * 验证 DoubaoContentOnlyTransformer 在不同事件类型下的转换行为。
 */
class DoubaoContentOnlyTransformerTest {

    private SsePayloadTransformerRegistry registry;

    @BeforeEach
    void setUp() {
        DoubaoContentExtractor extractor = new DoubaoContentExtractor();
        DoubaoContentOnlyTransformer transformer = new DoubaoContentOnlyTransformer(new ObjectMapper(), extractor);
        registry = new SsePayloadTransformerRegistry(List.of(transformer));
    }

    /**
     * 测试目标：确保 message 事件中的 JSON 消息体被转换为纯文本 content。
     * 前置条件：提供包含 choices/delta/messages 层级的 Doubao SSE data 片段。
     * 步骤：
     *  1) 调用注册表按 Doubao 模型与 message 事件执行转换；
     * 断言：
     *  - 返回值等于嵌套 content 字段内容，不包含原始 JSON 结构；
     * 边界/异常：
     *  - 如转换失败将返回原文，本用例即刻暴露问题。
     */
    @Test
    void transformMessageEventExtractsContent() {
        String json = "{\"choices\":[{\"delta\":{\"messages\":[{\"content\":\"hello\"}]}}]}";
        String result = registry.transform(DictionaryModel.DOUBAO.getClientName(), "message", json);
        assertEquals("hello", result);
    }

    /**
     * 测试目标：验证双重转义 JSON 经过转换后仍能正确抽取 content。
     * 前置条件：提供包含多层转义的 Doubao SSE data 片段。
     * 步骤：
     *  1) 调用转换策略处理带有反斜杠转义的 message 事件；
     * 断言：
     *  - 返回值为解码后的纯文本内容；
     * 边界/异常：
     *  - 若转义未正确处理将回退为原文，本用例可及时捕获。
     */
    @Test
    void transformHandlesEscapedJsonPayload() {
        String escaped = "{\\\"choices\\\":[{\\\"delta\\\":{\\\"content\\\":\\\"piece\\\"}}]}";
        String result = registry.transform(DictionaryModel.DOUBAO.getClientName(), "message", escaped);
        assertEquals("piece", result);
    }

    /**
     * 测试目标：验证非 message 事件保持原文，避免误改日志或控制事件数据。
     * 前置条件：准备 error 事件及其消息体。
     * 步骤：
     *  1) 调用转换方法处理 error 事件；
     * 断言：
     *  - 输出等于原始 JSON 数据。
     * 边界/异常：
     *  - 确保策略仅对 Doubao message 生效。
     */
    @Test
    void transformNonMessageEventKeepsOriginalData() {
        String json = "{\"message\":\"boom\"}";
        String result = registry.transform(DictionaryModel.DOUBAO.getClientName(), "error", json);
        assertEquals(json, result);
    }
}
