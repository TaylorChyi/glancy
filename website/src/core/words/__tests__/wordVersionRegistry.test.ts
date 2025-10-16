import { describe, expect, test } from "@jest/globals";
import {
  LatestTimestampStrategy,
  WordVersionRegistry,
  type WordCacheRecord,
} from "../wordVersionRegistry.js";

describe("WordVersionRegistry", () => {
  const registry = new WordVersionRegistry();

  /**
   * 测试目标：normalizeVersions 能够在缺失 ID 时自动生成稳定标识。
   * 前置条件：输入包含 id、versionId 以及 metadata.id 的混合场景。
   * 步骤：
   *  1) 调用 normalizeVersions；
   *  2) 收集输出 ID 集合。
   * 断言：
   *  - 每个版本均拥有非空 ID；
   *  - 原始顺序得以保留。
   * 边界/异常：
   *  - 空值将被过滤。
   */
  test("normalizes version identifiers deterministically", () => {
    const normalized = registry.normalizeVersions([
      { id: "explicit" },
      { versionId: 12 },
      { metadata: { id: "meta" } },
      null,
    ]);

    expect(normalized.map((item) => item.id)).toEqual([
      "explicit",
      "12",
      "meta",
    ]);
  });

  /**
   * 测试目标：mergeVersionCollections 在合并重复版本时优先采用最新增量。
   * 前置条件：存在旧版本集合与包含部分更新字段的增量。
   * 步骤：
   *  1) 调用 mergeVersionCollections；
   *  2) 检查合并后的字段取值。
   * 断言：
   *  - 新增的版本位于前列；
   *  - 冲突字段以增量为准。
   * 边界/异常：
   *  - 当增量为空时返回原集合。
   */
  test("merges version collections preferring incoming payload", () => {
    const existing = registry.normalizeVersions([
      { id: "keep", markdown: "legacy" },
      { id: "merge", markdown: "old" },
    ]);
    const incoming = registry.normalizeVersions([
      { id: "merge", markdown: "new" },
    ]);

    const merged = registry.mergeVersionCollections(existing, incoming);

    expect(merged.map((item) => item.id)).toEqual(["merge", "keep"]);
    expect(merged.find((item) => item.id === "merge")?.markdown).toBe("new");
  });

  /**
   * 测试目标：策略模式在缺少显式偏好时按时间排序选中最新版本。
   * 前置条件：提供具有不同时间戳的版本集合与空偏好。
   * 步骤：
   *  1) 使用 LatestTimestampStrategy 调用 resolveActiveVersionId；
   *  2) 验证返回 ID。
   * 断言：
   *  - 选中时间最新的版本；
   * 边界/异常：
   *  - 当所有时间戳缺失时回退至首项。
   */
  test("selects latest version when strategy fallback triggers", () => {
    const strategy = new LatestTimestampStrategy();
    const versions = registry.normalizeVersions([
      { id: "old", createdAt: "2024-01-01T00:00:00Z" },
      { id: "new", createdAt: "2024-06-01T00:00:00Z" },
    ]);
    const record: WordCacheRecord = {
      versions,
      activeVersionId: null,
      metadata: {},
    };

    const selected = strategy.pick({ versions, current: record });
    expect(selected).toBe("new");
  });
});
