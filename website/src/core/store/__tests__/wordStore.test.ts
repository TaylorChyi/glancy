import { beforeEach, describe, expect, test } from "@jest/globals";
import { useWordStore } from "../wordStore.js";

type WordStoreState = ReturnType<typeof useWordStore.getState>;
type WordIdentifier = Parameters<WordStoreState["getRecord"]>[0];
type VersionPayload = Parameters<WordStoreState["setVersions"]>[1];
type VersionOptions = Parameters<WordStoreState["setVersions"]>[2];

const getStore = (): WordStoreState => useWordStore.getState();

const clearWordStore = () => {
  getStore().clear();
};

const registerWordStoreLifecycle = () => {
  beforeEach(clearWordStore);
};

const setVersions = (
  identifier: WordIdentifier,
  versions: VersionPayload,
  options?: VersionOptions,
) => {
  getStore().setVersions(identifier, versions, options);
  return getStore().getRecord(identifier);
};

const setActiveVersion = (identifier: WordIdentifier, versionId: string) => {
  getStore().setActiveVersion(identifier, versionId);
  return getStore().getRecord(identifier);
};

const removeVersions = (identifier: WordIdentifier, ...versionIds: string[]) => {
  getStore().removeVersions(identifier, ...versionIds);
  return getStore().getRecord(identifier);
};

const getEntryMarkdown = (identifier: WordIdentifier) =>
  getStore().getEntry(identifier)?.markdown;

const getActiveVersionId = (identifier: WordIdentifier) =>
  getStore().getRecord(identifier)?.activeVersionId;

describe("wordStore version lifecycle", () => {
  registerWordStoreLifecycle();

  test("manages versions through activation and removal", () => {
    setVersions(
      "term:en",
      [
        { id: "v1", markdown: "first" },
        { versionId: "v2", markdown: "second" },
      ],
      { activeVersionId: "v1", metadata: { tone: "warm" } },
    );

    expect(getEntryMarkdown("term:en")).toBe("first");
    expect(getStore().getRecord("term:en")?.metadata).toEqual({ tone: "warm" });

    setActiveVersion("term:en", "v2");
    expect(getEntryMarkdown("term:en")).toBe("second");

    removeVersions("term:en", "v2");
    expect(getEntryMarkdown("term:en")).toBe("first");
    expect(getActiveVersionId("term:en")).toBe("v1");
  });
});

describe("wordStore default selection", () => {
  registerWordStoreLifecycle();

  test("selects the most recent version when active id missing", () => {
    setVersions("term:fr", [
      { id: "old", createdAt: "2024-01-01T10:00:00Z" },
      { id: "new", createdAt: "2024-05-01T08:00:00Z" },
    ]);

    expect(getActiveVersionId("term:fr")).toBe("new");
  });
});

describe("wordStore incremental updates", () => {
  registerWordStoreLifecycle();

  test("merges partial payloads with existing versions", () => {
    setVersions(
      "term:es",
      [
        { id: "v1", markdown: "uno" },
        { id: "v2", markdown: "dos" },
      ],
      { activeVersionId: "v2" },
    );

    const record = setVersions(
      "term:es",
      [{ id: "v2", markdown: "dos actualizado" }],
      { activeVersionId: "v2" },
    );

    expect(record?.versions).toHaveLength(2);
    expect(record?.versions.find((version) => version.id === "v1")?.markdown).toBe(
      "uno",
    );
    expect(record?.versions.find((version) => version.id === "v2")?.markdown).toBe(
      "dos actualizado",
    );
    expect(getActiveVersionId("term:es")).toBe("v2");
  });
});

describe("wordStore removal safeguards", () => {
  registerWordStoreLifecycle();

  test("reselects active version when current is removed", () => {
    setVersions(
      "term:jp",
      [
        { id: "v1", createdAt: "2024-05-01T00:00:00Z" },
        { id: "v2", createdAt: "2024-06-01T00:00:00Z" },
        { id: "v3", createdAt: "2024-04-01T00:00:00Z" },
      ],
      { activeVersionId: "v2" },
    );

    expect(removeVersions("term:jp", "v2")?.activeVersionId).toBe("v1");
    expect(removeVersions("term:jp")?.versions).toBeUndefined();
  });
});
