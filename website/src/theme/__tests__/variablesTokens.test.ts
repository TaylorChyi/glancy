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
   * 测试目标：验证浅色主题下语音/发送按钮图标色令牌映射到反相文字语义，避免黑色图标叠加深色底。 
   * 前置条件：无，直接读取 CSS 变量定义。 
   * 步骤：
   *  1) 读取 variables.css 文件内容。
   *  2) 抽取 light 主题代码块。
   *  3) 判断 voice/send 颜色变量是否指向 color-text-inverse，并具备 neutral-0 令牌兜底。
   * 断言：变量字符串同时包含 color-text-inverse 与 neutral-0，缺失时提示具体变量名称。
   * 边界/异常：若匹配失败返回空字符串，断言会明确说明未捕获到对应主题块。
   */
  it("Given light theme tokens When reading send/voice colors Then they map to inverse text", () => {
    const css = readVariablesCss();
    const lightBlock = extractThemeBlock(css, ':root[data-theme="light"]');

    expect(lightBlock.length).toBeGreaterThan(0);
    expect(lightBlock).toMatch(
      /--sb-voice-color: var\(\s*--color-text-inverse,\s*var\(--neutral-0\)\s*\);/u,
    );
    expect(lightBlock).toMatch(
      /--sb-send-color: var\(\s*--color-text-inverse,\s*var\(--neutral-0\)\s*\);/u,
    );
  });
});
