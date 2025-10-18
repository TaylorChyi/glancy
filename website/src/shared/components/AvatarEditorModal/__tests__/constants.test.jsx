import { createMergedLabels } from "../constants.js";

/**
 * 测试目标：默认标签与外部 labels 合并策略。
 * 前置条件：提供部分覆盖字段的 labels。
 * 步骤：
 *  1) 调用 createMergedLabels，传入覆盖 title 与 confirm；
 *  2) 观察返回对象。
 * 断言：
 *  - 未覆盖字段沿用默认文案；
 *  - 覆盖字段采用外部值。
 * 边界/异常：
 *  - labels 为空时返回默认对象在其他用例中覆盖。
 */
test("Given partial overrides When merging labels Then defaults are preserved", () => {
  const merged = createMergedLabels({ title: "覆盖标题", confirm: "保存" });
  expect(merged.title).toBe("覆盖标题");
  expect(merged.confirm).toBe("保存");
  expect(merged.zoomIn).toBe("放大");
});

/**
 * 测试目标：确认传入 undefined 时返回默认标签引用。
 * 前置条件：labels 参数为 undefined。
 * 步骤：
 *  1) 调用 createMergedLabels();
 *  2) 再次调用并比较引用。
 * 断言：
 *  - 两次调用返回的对象引用不同以避免外部修改污染默认值；
 *  - 文案内容等于默认值。
 * 边界/异常：
 *  - 若需复用引用，可在后续调整实现。
 */
test("Given no overrides When merging labels Then defaults are cloned", () => {
  const first = createMergedLabels();
  const second = createMergedLabels();
  expect(first).not.toBe(second);
  expect(first.title).toBe("调整头像位置");
  expect(second.zoomOut).toBe("缩小");
});
