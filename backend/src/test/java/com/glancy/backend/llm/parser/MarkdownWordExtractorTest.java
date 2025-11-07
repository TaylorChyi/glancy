package com.glancy.backend.llm.parser;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;


class MarkdownWordExtractorTest {

    /**
     * 测试目标：
     *  - 验证 Doubao 返回的新增章节标题能够正确映射到 variations、phrases、definitions 集合。
     * 前置条件：
     *  - 构造包含标准释义与新增标题的 Markdown 字符串。
     * 步骤：
     *  1) 调用 MarkdownWordExtractor.extract 解析 Markdown 文本。
     *  2) 获取解析结果中的集合字段。
     * 断言：
     *  - variations 包含派生词，顺序与输入一致。
     *  - phrases 吸收 Collocations 信息。
     *  - definitions 合并 HistoricalResonance 内容。
     * 边界/异常：
     *  - 若映射缺失，将触发默认 DEFINITION 行为导致断言失败，及时暴露协议不兼容问题。
     */
    @Test
    void givenNewHeadings_whenExtract_thenCollectionsArePopulated() {
        String markdown = """
            # Run
            ## Definition
            - to move swiftly on foot
            ## Derivatives&ExtendedForms
            - runner
            - running
            ## Collocations
            - run into trouble
            ## HistoricalResonance
            - Historically used to describe river flow.
            """;

        MarkdownWordSnapshot snapshot = MarkdownWordExtractor.extract(markdown, "run");

        assertThat(snapshot.variations()).containsExactly("runner", "running");
        assertThat(snapshot.phrases()).containsExactly("run into trouble");
        assertThat(snapshot.definitions()).containsExactly(
            "to move swiftly on foot",
            "Historically used to describe river flow."
        );
    }
}
