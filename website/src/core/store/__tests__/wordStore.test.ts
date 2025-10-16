import { beforeEach, describe, expect, test } from "@jest/globals";
import { useWordStore } from "../wordStore.js";

describe("wordStore", () => {
  beforeEach(() => {
    useWordStore.getState().clear();
  });

  /**
   * 测试目标：验证 setVersions 能够写入多版本并保持激活指针及元数据。
   * 前置条件：wordStore 初始为空。
   * 步骤：
   *  1) 写入两个版本并指定激活 ID 与元数据；
   *  2) 切换激活版本；
   *  3) 移除部分版本并校验指针回退。
   * 断言：
   *  - getEntry 返回激活版本内容；
   *  - getRecord 暴露合并后的元数据与激活 ID；
   * 边界/异常：
   *  - 移除激活版本后应回退到剩余版本。
   */
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

    expect(useWordStore.getState().getEntry("term:en")?.markdown).toBe("first");
    expect(useWordStore.getState().getRecord("term:en")?.metadata).toEqual({
      tone: "warm",
    });

    store.setActiveVersion("term:en", "v2");
    expect(useWordStore.getState().getEntry("term:en")?.markdown).toBe("second");

    store.removeVersions("term:en", "v2");
    const entry = useWordStore.getState().getEntry("term:en");
    expect(entry?.markdown).toBe("first");
    expect(useWordStore.getState().getRecord("term:en")?.activeVersionId).toBe("v1");
  });

  /**
   * 测试目标：确保未指定激活版本时默认选中最新时间戳版本。
   * 前置条件：提供两个具有不同 createdAt 的版本。
   * 步骤：
   *  1) setVersions 写入版本但不传 activeVersionId；
   *  2) 读取缓存记录。
   * 断言：
   *  - activeVersionId 指向时间最新的版本。
   * 边界/异常：
   *  - 当时间戳无效时按照插入顺序回退。
   */
  test("defaults to the most recent version when active id missing", () => {
    const store = useWordStore.getState();
    store.setVersions("term:fr", [
      { id: "old", createdAt: "2024-01-01T10:00:00Z" },
      { id: "new", createdAt: "2024-05-01T08:00:00Z" },
    ]);

    const record = useWordStore.getState().getRecord("term:fr");
    expect(record?.activeVersionId).toBe("new");
  });

  /**
   * 测试目标：验证增量写入仅包含部分版本时可正确合并与保留历史。
   * 前置条件：缓存中已存在两个版本。
   * 步骤：
   *  1) 首次写入两个版本并指定激活版本；
   *  2) 第二次仅写入其中一个版本的增量；
   *  3) 读取缓存。
   * 断言：
   *  - 历史版本仍然存在；
   *  - 被更新的版本合并为最新数据；
   * 边界/异常：
   *  - 若增量未包含激活版本，激活 ID 不应变更。
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
    expect(record?.versions).toHaveLength(2);
    expect(record?.versions.find((version) => version.id === "v1")?.markdown).toBe(
      "uno",
    );
    expect(record?.versions.find((version) => version.id === "v2")?.markdown).toBe(
      "dos actualizado",
    );
    expect(record?.activeVersionId).toBe("v2");
  });

  /**
   * 测试目标：确认 removeVersions 在清除激活版本后会重新选取有效指针。
   * 前置条件：缓存中存在三个版本且激活指向第二个。
   * 步骤：
   *  1) 写入三个版本并设定激活 ID；
   *  2) removeVersions 删除激活版本；
   *  3) 读取记录。
   * 断言：
   *  - activeVersionId 回退到剩余版本中的最新一项；
   * 边界/异常：
   *  - 删除全部版本时应移除缓存记录（通过 getRecord 返回 undefined 验证）。
   */
  test("reselects active version when current is removed", () => {
    const store = useWordStore.getState();
    store.setVersions(
      "term:jp",
      [
        { id: "v1", createdAt: "2024-05-01T00:00:00Z" },
        { id: "v2", createdAt: "2024-06-01T00:00:00Z" },
        { id: "v3", createdAt: "2024-04-01T00:00:00Z" },
      ],
      { activeVersionId: "v2" },
    );

    store.removeVersions("term:jp", "v2");
    const record = useWordStore.getState().getRecord("term:jp");
    expect(record?.activeVersionId).toBe("v1");

    store.removeVersions("term:jp");
    expect(useWordStore.getState().getRecord("term:jp")).toBeUndefined();
  });
});
