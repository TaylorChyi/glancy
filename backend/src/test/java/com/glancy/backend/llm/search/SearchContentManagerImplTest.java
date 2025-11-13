package com.glancy.backend.llm.search;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class SearchContentManagerImplTest {

    private final SearchContentManagerImpl manager = new SearchContentManagerImpl();

    /**
     * 测试目标：验证 normalize 会去除首尾空白、标点并转为小写。\ 前置条件： - 输入包含多余空格与标点。\ 步骤： 1) 调用 normalize(" Hello!!! ").\
     * 断言： - 结果为 "hello"。\ 边界/异常： - 覆盖空白与标点混合场景。
     */
    @Test
    void testNormalizeRemovesPunctuationAndWhitespace() {
        assertEquals("hello", manager.normalize("  Hello!!! "));
    }

    /**
     * 测试目标：验证 normalize 会折叠多重空白并保留词中连字符。\ 前置条件： - 输入包含多个空格和连字符。\ 步骤： 1) 调用 normalize("State - of -
     * the art").\ 断言： - 结果为 "state - of - the art"。\ 边界/异常： - 覆盖空白折叠及合法符号保留场景。
     */
    @Test
    void testNormalizeCollapsesWhitespaceAndKeepsHyphen() {
        assertEquals("state - of - the art", manager.normalize("State   -  of   -   the   art"));
    }
}
