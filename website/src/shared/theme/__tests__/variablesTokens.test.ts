import fs from "node:fs";

const readVariablesCss = () => {
  const fileUrl = new URL("../variables.css", import.meta.url);
  return fs.readFileSync(fileUrl, "utf8");
};

const extractThemeBlock = (css: string, selector: string) => {
  const selectorIndex = css.indexOf(selector);
  if (selectorIndex === -1) {
    return "";
  }

  const blockStart = css.indexOf("{", selectorIndex);
  if (blockStart === -1) {
    return "";
  }

  let depth = 0;
  for (let cursor = blockStart; cursor < css.length; cursor += 1) {
    const char = css[cursor];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(blockStart + 1, cursor);
      }
    }
  }

  return "";
};

describe("theme variable mappings", () => {
  /**
   * 测试目标：验证浅色主题下语音/发送按钮图标色回归到通用 icon 语义，避免样式迁移遗留反相色。
   * 前置条件：无，直接读取 CSS 变量定义。
   * 步骤：
   *  1) 读取 variables.css 文件内容。
   *  2) 抽取 light 主题代码块。
   *  3) 判断 voice/send 颜色变量是否指向 --sb-icon 令牌。
   * 断言：变量字符串包含 --sb-icon，缺失时提示具体变量名称。
   * 边界/异常：若匹配失败返回空字符串，断言会明确说明未捕获到对应主题块。
   */
  it("Given light theme tokens When reading send/voice colors Then they reuse icon tone", () => {
    const css = readVariablesCss();
    const lightBlock = extractThemeBlock(css, ':root[data-theme="light"]');

    expect(lightBlock.length).toBeGreaterThan(0);
    expect(lightBlock).toMatch(/--sb-voice-color: var\(--sb-icon\);/u);
    expect(lightBlock).toMatch(/--sb-send-color: var\(--sb-icon\);/u);
  });
});
