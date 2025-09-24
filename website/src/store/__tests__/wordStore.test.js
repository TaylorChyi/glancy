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

  /**
   * 当后续写入仅返回部分版本时，需与已有缓存合并，确保历史版本仍可切换。
   */
  test("merges partial payloads with existing versions", () => {
    const store = useWordStore.getState();
    store.setVersions(
      "term:es",
      [
        { id: "v1", markdown: "uno" },
        { id: "v2", markdown: "dos" },
      ],
      { activeVersionId: "v2" },
    );

    store.setVersions("term:es", [{ id: "v2", markdown: "dos actualizado" }], {
      activeVersionId: "v2",
    });

    const record = useWordStore.getState().getRecord("term:es");
    expect(record.versions).toHaveLength(2);
    expect(
      record.versions.find((version) => version.id === "v1").markdown,
    ).toBe("uno");
    expect(
      record.versions.find((version) => version.id === "v2").markdown,
    ).toBe("dos actualizado");
    expect(record.activeVersionId).toBe("v2");
  });
});
