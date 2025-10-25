import { toHistoryItem } from "@core/history/index.ts";
import type { SearchRecordDto } from "@core/history/index.ts";

/**
 * 测试目标：映射器优先使用 metadata 中提供的规范词形。
 * 前置条件：输入记录 term 存在拼写错误而 metadata.term 提供正确值。
 * 步骤：
 *  1) 构造包含 metadata 的记录；
 *  2) 执行 toHistoryItem；
 * 断言：
 *  - term 与 termKey 均使用规范词形。
 * 边界/异常：
 *  - 如果 metadata 为空，映射器会继续尝试版本与原始词形（见其他用例）。
 */
test("Given metadata canonical When mapping record Then prefer metadata term", () => {
  const record: SearchRecordDto = {
    id: "1001",
    term: "studdent",
    metadata: { term: "student" },
    language: "english",
    flavor: "bilingual",
    createdAt: "2024-01-01T00:00:00Z",
    versions: null,
  };

  const result = toHistoryItem(record);

  expect(result.term).toBe("student");
  expect(result.termKey).toBe("ENGLISH:BILINGUAL:student");
});

/**
 * 测试目标：当 metadata 缺失时，映射器会回退至版本信息并保持最新版本优先。
 * 前置条件：latestVersionId 与 versions 列表提供规范词形。
 * 步骤：
 *  1) 构造包含两个版本的记录；
 *  2) 调用 toHistoryItem；
 * 断言：
 *  - term 与 latestVersionId 对应的版本一致；
 *  - createdAt 从版本属性回填。
 * 边界/异常：
 *  - 当所有版本缺失 term 时，映射器会继续降级至原始 term。
 */
test("Given latest version id When mapping record Then use version term", () => {
  const record: SearchRecordDto = {
    id: "2001",
    term: "placeholder",
    language: "ENGLISH",
    flavor: "bilingual",
    createdAt: null,
    versions: [
      {
        id: "ver-1",
        term: "draft",
        createdAt: "2024-02-01T10:00:00Z",
      },
      {
        id: "ver-2",
        term: "final",
        createdAt: "2024-02-02T12:00:00Z",
      },
    ],
  } as SearchRecordDto;

  const result = toHistoryItem(record);

  expect(result.term).toBe("final");
  expect(result.latestVersionId).toBe("ver-2");
  expect(result.createdAt).toBe("2024-02-02T12:00:00Z");
});

/**
 * 测试目标：缺失 metadata 和 versions 时回退至原始 term，确保流程可降级。
 * 前置条件：记录仅包含基础字段。
 * 步骤：
 *  1) 调用 toHistoryItem；
 *  2) 读取结果。
 * 断言：
 *  - term/termKey 直接使用原始词形的归一化结果；
 *  - createdAt 保持默认值。
 * 边界/异常：
 *  - 若 term 为空字符串，termKey 仍会遵循归一化策略（此处未覆盖）。
 */
test("Given minimal record When mapping record Then fall back to raw term", () => {
  const record: SearchRecordDto = {
    id: null,
    term: "hello",
    language: undefined,
    flavor: undefined,
    versions: [],
  };

  const result = toHistoryItem(record);

  expect(result.term).toBe("hello");
  expect(result.termKey).toBe("ENGLISH:BILINGUAL:hello");
  expect(result.createdAt).toBeNull();
});
