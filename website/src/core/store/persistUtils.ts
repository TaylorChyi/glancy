import type { StateStorage } from "zustand/middleware";

export function pickState<T extends object, K extends keyof T>(keys: K[]) {
  return (state: T) => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      result[key] = state[key];
    }
    return result;
  };
}

const inMemoryStorage: StateStorage = (() => {
  const store = new Map<string, string>();

  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: (name) => {
      store.delete(name);
    },
  };
})();

function attemptLocalStorageAccess(key: string): StateStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storage = window.localStorage;
    const probeKey = `__glancy-storage-probe__${key}`;
    storage.setItem(probeKey, probeKey);
    storage.removeItem(probeKey);
    return storage;
  } catch (error) {
    if (
      typeof process !== "undefined" &&
      process?.env?.NODE_ENV !== "production" &&
      process?.env?.NODE_ENV !== "test"
    ) {
      console.warn("Falling back to in-memory storage due to access issue.", {
        error,
        key,
      });
    }
    return null;
  }
}

export function resolveStateStorage(key: string): StateStorage {
  return attemptLocalStorageAccess(key) ?? inMemoryStorage;
}
