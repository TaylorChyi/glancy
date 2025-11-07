import { polishDictionaryMarkdown } from "../markdown.js";

/**
 * 测试目标：确保冒号补空格逻辑不会破坏 URL 语法。
 * 前置条件：输入文本包含标准的 http 链接。
 * 步骤：
 *  1) 传入带 URL 的字符串；
 *  2) 调用 polishDictionaryMarkdown。
 * 断言：
 *  - 输出与原始字符串一致；若失败说明冒号补空格误伤协议前缀。
 * 边界/异常：
 *  - 覆盖最常见的 URL 协议格式。
 */
test("polishDictionaryMarkdown preserves url colon usage", () => {
  const source = "See http://example.com for details";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(source);
});

/**
 * 测试目标：验证英文标点后会自动补空格，避免释义文本紧贴导致阅读困难。
 * 前置条件：构造逗号与感叹号后缺少空格的 Markdown 行。
 * 步骤：
 *  1) 调用 polishDictionaryMarkdown 处理原始字符串；
 * 断言：
 *  - 逗号与感叹号后补齐空格；失败说明标点间距修复逻辑失效。
 * 边界/异常：
 *  - 覆盖多种英文标点组合。
 */
test("polishDictionaryMarkdown enforces spacing after english punctuation", () => {
  const source = "- **释义**: Follow me,please!Keep pace.";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe("- **释义**: Follow me, please! Keep pace.");
});

/**
 * 测试目标：例句正文中的分词标注需自动补空格，确保中英混排保持清晰断句。
 * 前置条件：例句行包含 [[大熊猫]]、#竹林#、{{保护区}} 等分词符号以及英文标点。
 * 步骤：
 *  1) 使用 polishDictionaryMarkdown 处理例句行；
 *  2) 对比处理后的字符串。
 * 断言：
 *  - 分词标记与正文间存在单个空格，英文标点后补空格；失败说明分词间距逻辑异常。
 * 边界/异常：
 *  - 覆盖多种分词标记组合与混合标点。
 */
test("polishDictionaryMarkdown applies segmentation spacing to example content", () => {
  const source =
    "- **例句（中文）**: [[大熊猫]]栖息在#竹林#里,并且很可爱!还有{{保护区}}。";
  const result = polishDictionaryMarkdown(source);
  expect(result).toBe(
    "- **例句（中文）**: [[大熊猫]] 栖息在 #竹林# 里, 并且很可爱! 还有 {{保护区}}。",
  );
});
