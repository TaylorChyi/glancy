import { jest } from "@jest/globals";

import { __INTERNAL__ } from "./canvasRenderer.js";

const { wrapLine, measureDocumentHeight } = __INTERNAL__;

describe("canvasRenderer", () => {
  const createStubCtx = () => ({
    font: "",
    measureText: (text) => ({ width: text.length * 10 }),
    fillText: jest.fn(),
  });

  test("wrapLine splits long tokens when exceeding width", () => {
    /**
     * 测试目标：
     *  - 验证 wrapLine 在单词长度超过最大宽度时按字符拆分。
     * 前置条件：
     *  - 设定测量函数按字符返回宽度，每字符 10px。
     * 步骤：
     *  1) 调用 wrapLine 处理无空格长字符串。
     * 断言：
     *  - 结果按最大宽度拆分且不存在空串。
     * 边界/异常：
     *  - 若出现空串或遗漏字符则失败。
     */
    const ctx = createStubCtx();
    const result = wrapLine(ctx, "abcdefghij", 30);
    expect(result).toEqual(["abc", "def", "ghi", "j"]);
  });

  test("measureDocumentHeight accumulates spacing for title and sections", () => {
    /**
     * 测试目标：
     *  - 确认文档高度计算考虑标题、段落与页脚间距。
     * 前置条件：
     *  - 使用固定宽度测量上下文，文档包含标题与单段文字。
     * 步骤：
     *  1) 调用 measureDocumentHeight。
     * 断言：
     *  - 返回值大于基础页脚高度，表示标题与正文被统计。
     * 边界/异常：
     *  - 若返回值小于等于页脚高度则失败。
     */
    const ctx = createStubCtx();
    const documentModel = {
      title: "Short title",
      sections: [
        { heading: "Heading", lines: ["Line"] },
        { heading: "", lines: [] },
      ],
    };
    const height = measureDocumentHeight(ctx, documentModel);
    expect(height).toBeGreaterThan(200);
  });
});
