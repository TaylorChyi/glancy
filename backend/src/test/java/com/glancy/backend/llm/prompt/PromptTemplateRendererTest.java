package com.glancy.backend.llm.prompt;

import com.glancy.backend.llm.service.WordPromptTemplateConstants;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * 测试目标：验证模板渲染器能够替换占位符并处理缺省变量。 前置条件：使用默认构造的渲染器处理内存常量模板。 步骤： 1) 渲染包含占位符的模板。 2) 渲染同一路径但不同上下文的模板。 断言： -
 * 替换后的内容与预期一致。 - 缺省变量回退为空字符串。 边界/异常： - 当模板内容为空字符串时抛出非法参数异常。
 */
class PromptTemplateRendererTest {

  private PromptTemplateRenderer renderer;

  @BeforeEach
  void setUp() {
    renderer = new PromptTemplateRenderer();
  }

  @Test
  /**
   * 测试目标：渲染器应正确替换模板中的占位符。 前置条件：提供 USER_GOAL 模板与含 goal 的上下文。 步骤： 1) 使用不同上下文渲染模板两次。 断言： -
   * 两次渲染结果分别包含对应的目标内容。 边界/异常： - 若替换失败将导致断言不满足。
   */
  void renderInjectsContextValues() {
    String first = renderer.render(WordPromptTemplateConstants.USER_GOAL, Map.of("goal", "流利表达"));
    String second = renderer.render(WordPromptTemplateConstants.USER_GOAL, Map.of("goal", "精准理解"));
    Assertions.assertEquals("学习目标：流利表达\n", first);
    Assertions.assertEquals("学习目标：精准理解\n", second);
  }

  @Test
  /**
   * 测试目标：当上下文缺失占位符时应退化为空字符串。 前置条件：提供 USER_GOAL 模板与空上下文。 步骤： 1) 渲染模板并检查输出。 断言： - 输出中的变量位置为空。 边界/异常：
   * - 若渲染器未处理缺省值将导致断言失败。
   */
  void renderMissingContextFallsBackToEmpty() {
    String content = renderer.render(WordPromptTemplateConstants.USER_GOAL, Map.of());
    Assertions.assertEquals("学习目标：\n", content);
  }

  @Test
  /**
   * 测试目标：验证字符串模板重载可以处理行内模板。 前置条件：提供含单一占位符的字符串模板与上下文。 步骤： 1) 调用字符串重载渲染模板。 断言： - 渲染结果中占位符被替换。 边界/异常：
   * - 若重载方法未处理占位符，将出现断言失败。
   */
  void renderSupportsInlineTemplateContent() {
    String content = renderer.render("您好，{{name}}。", Map.of("name", "测试者"));
    Assertions.assertEquals("您好，测试者。", content);
  }

  @Test
  /**
   * 测试目标：确保空模板内容触发参数校验异常。 前置条件：传入空字符串模板与任意上下文。 步骤： 1) 调用渲染方法并捕获异常。 断言： - 抛出
   * IllegalArgumentException。 边界/异常： - 若未抛出异常则说明参数校验缺失。
   */
  void renderRejectsEmptyTemplate() {
    Assertions.assertThrows(IllegalArgumentException.class, () -> renderer.render("", Map.of()));
  }
}
