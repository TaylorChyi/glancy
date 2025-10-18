/**
 * 背景：
 *  - polishDictionaryMarkdown 除断行外还负责标点与分词间距修复，这些规则需要独立的回归保障。
 * 目的：
 *  - 聚焦记录与标点、URL、安全替换相关的测试，避免分散在结构类用例中被忽视。
 * 关键决策与取舍：
 *  - 继续使用真实的示例文本以检验空格与标点细节；
 *  - 将 URL 保护逻辑与间距修复放在同一文件，方便后续扩展更多“非断行”类规则。
 * 影响范围：
 *  - 仅调整测试文件组织结构，业务逻辑不受影响；
 *  - 拆分后能更快定位间距相关回归。
 * 演进与TODO：
 *  - 若未来增加更多特殊标点兼容逻辑，可在此继续补充参数化用例。
 */
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
