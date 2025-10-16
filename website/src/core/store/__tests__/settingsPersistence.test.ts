import { jest } from "@jest/globals";
import {
  LEGACY_LANGUAGE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  SYSTEM_LANGUAGE_AUTO,
} from "@core/store/settings/model";
import {
  extractDictionaryPersistence,
  persistLegacySystemLanguage,
  readPersistedSettingsSnapshot,
  resolveInitialSystemLanguage,
} from "@core/store/settings/persistence";

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
};

/**
 * 测试目标：验证 resolveInitialSystemLanguage 按“持久化 -> legacy -> 默认”职责链解析。
 * 前置条件：准备空存储、带持久化数据与 legacy 数据的场景。
 * 步骤：
 *  1) 空存储应返回 AUTO。
 *  2) 写入持久化 settings，期望命中第一层 resolver。
 *  3) 清空持久化，写入 legacy，期望命中第二层 resolver。
 * 断言：
 *  - 顺序命中对应的语言值。
 * 边界/异常：
 *  - 覆盖解析失败时的默认回退。
 */
test("resolveInitialSystemLanguage composes resolver chain", () => {
  const storage = createMemoryStorage();
  expect(resolveInitialSystemLanguage(storage)).toBe(SYSTEM_LANGUAGE_AUTO);

  storage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ state: { systemLanguage: "en" } }),
  );
  expect(resolveInitialSystemLanguage(storage)).toBe("en");

  storage.removeItem(SETTINGS_STORAGE_KEY);
  storage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, "zh");
  expect(resolveInitialSystemLanguage(storage)).toBe("zh");
});

/**
 * 测试目标：验证 readPersistedSettingsSnapshot 在解析失败时返回 null 并不抛出。
 * 前置条件：存储中写入非法 JSON。
 * 步骤：
 *  1) 写入非法字符串。
 *  2) 调用读取方法。
 * 断言：
 *  - 返回 null。
 * 边界/异常：
 *  - 确认异常被捕获。
 */
test("readPersistedSettingsSnapshot guards invalid payload", () => {
  const storage = createMemoryStorage();
  const warnSpy = jest
    .spyOn(console, "warn")
    .mockImplementation(() => undefined);
  storage.setItem(SETTINGS_STORAGE_KEY, "{ invalid json }");
  expect(readPersistedSettingsSnapshot(storage)).toBeNull();
  expect(warnSpy).toHaveBeenCalledTimes(1);
  warnSpy.mockRestore();
});

/**
 * 测试目标：验证 extractDictionaryPersistence 正确返回持久化标记。
 * 前置条件：构造包含字典字段的 snapshot。
 * 步骤：
 *  1) 调用函数获取结果。
 * 断言：
 *  - source/target 与布尔标记匹配输入。
 * 边界/异常：
 *  - 支持 snapshot 为 null 的情况。
 */
test("extractDictionaryPersistence exposes presence flags", () => {
  const snapshot = {
    state: {
      dictionarySourceLanguage: "CHINESE",
      dictionaryTargetLanguage: "ENGLISH",
    },
  };
  expect(extractDictionaryPersistence(snapshot)).toEqual({
    source: "CHINESE",
    target: "ENGLISH",
    hasSource: true,
    hasTarget: true,
  });
  expect(extractDictionaryPersistence(null)).toEqual({
    source: undefined,
    target: undefined,
    hasSource: false,
    hasTarget: false,
  });
});

/**
 * 测试目标：验证 persistLegacySystemLanguage 会在 AUTO 时清理存储，在合法值时写入。
 * 前置条件：准备空存储。
 * 步骤：
 *  1) 写入合法值。
 *  2) 写入 AUTO。
 * 断言：
 *  - 第一步后存在持久化。
 *  - 第二步后条目被移除。
 * 边界/异常：
 *  - 覆盖非法值不写入的逻辑。
 */
test("persistLegacySystemLanguage manages storage lifecycle", () => {
  const storage = createMemoryStorage();
  persistLegacySystemLanguage(storage, "en");
  expect(storage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)).toBe("en");
  persistLegacySystemLanguage(storage, SYSTEM_LANGUAGE_AUTO);
  expect(storage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)).toBeNull();
  persistLegacySystemLanguage(storage, "unknown");
  expect(storage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)).toBeNull();
});
