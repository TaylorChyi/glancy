package com.glancy.backend.llm.prompt;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.llm.service.WordPromptTemplate;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

/**
 * 测试目标：验证模板渲染器能够替换占位符并处理缺省变量。
 * 前置条件：使用默认资源加载器读取类路径下的实际模板文件。
 * 步骤：
 *  1) 渲染包含占位符的模板。
 *  2) 渲染同一路径但不同上下文的模板。
 * 断言：
 *  - 替换后的内容与预期一致。
 *  - 缺省变量回退为空字符串。
 * 边界/异常：
 *  - 当资源缺失时抛出非法参数异常。
 */
class PromptTemplateRendererTest {

    private PromptTemplateRenderer renderer;

    @BeforeEach
    void setUp() {
        renderer = new PromptTemplateRenderer(new DefaultResourceLoader());
    }

    @Test
    void renderInjectsContextValues() {
        String first = renderer.render(WordPromptTemplate.USER_GOAL.path(), Map.of("goal", "流利表达"));
        String second = renderer.render(WordPromptTemplate.USER_GOAL.path(), Map.of("goal", "精准理解"));
        assertEquals("\n学习目标：流利表达", first);
        assertEquals("\n学习目标：精准理解", second);
    }

    @Test
    void renderMissingContextFallsBackToEmpty() {
        String content = renderer.render(WordPromptTemplate.USER_GOAL.path(), Map.of());
        assertEquals("\n学习目标：", content);
    }

    @Test
    void renderThrowsWhenTemplateMissing() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
            renderer.render("prompts/word/non-existent.txt", Map.of())
        );
        assertTrue(exception.getMessage().contains("Template resource missing"));
    }
}
