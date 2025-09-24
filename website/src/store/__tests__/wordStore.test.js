import { describe, expect, test, beforeEach } from "@jest/globals";
import { useWordStore } from "../wordStore.js";

/**
 * 测试逻辑:
 *  1. 通过 setVersions 写入多个版本并读取默认激活版本。
 *  2. 切换激活版本后验证 getEntry 输出更新。
 *  3. 移除版本时自动修正激活指针。
 */
describe("wordStore", () => {
  beforeEach(() => {
    useWordStore.getState().clear();
  });

  test("manages version lifecycle", () => {
    const store = useWordStore.getState();
    store.setVersions(
      "term:en",
      [
        { id: "v1", markdown: "first" },
        { versionId: "v2", markdown: "second" },
      ],
      { activeVersionId: "v1", metadata: { tone: "warm" } },
    );

    expect(useWordStore.getState().getEntry("term:en").markdown).toBe("first");
    expect(useWordStore.getState().getRecord("term:en").metadata).toEqual({
      tone: "warm",
    });

    store.setActiveVersion("term:en", "v2");
    expect(useWordStore.getState().getEntry("term:en").markdown).toBe("second");

    store.removeVersions("term:en", "v2");
    const entry = useWordStore.getState().getEntry("term:en");
    expect(entry.markdown).toBe("first");
    expect(useWordStore.getState().getRecord("term:en").activeVersionId).toBe(
      "v1",
    );
  });

  /**
   * 当未指定激活版本时，默认选中最新时间戳的版本。
   */
  test("defaults to the most recent version when active id missing", () => {
    const store = useWordStore.getState();
    store.setVersions("term:fr", [
      { id: "old", createdAt: "2024-01-01T10:00:00Z" },
      { id: "new", createdAt: "2024-05-01T08:00:00Z" },
    ]);

    const record = useWordStore.getState().getRecord("term:fr");
    expect(record.activeVersionId).toBe("new");
  });
});
