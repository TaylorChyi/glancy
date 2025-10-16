import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from "zustand/middleware";
import { resolveStateStorage } from "./persistUtils.js";
import { type StoreKey } from "./storeKeys.js";
import type { StateCreator, StoreApi, UseBoundStore } from "zustand";

interface Options<T> {
  key: StoreKey;
  initializer: StateCreator<T>;
  persistOptions?: Omit<PersistOptions<T>, "name" | "storage">;
}

export function createPersistentStore<T>({
  key,
  initializer,
  persistOptions,
}: Options<T>): UseBoundStore<StoreApi<T>> {
  return create<T>()(
    persist(initializer, {
      name: key,
      storage: createJSONStorage(() => resolveStateStorage(key)),
      ...(persistOptions ?? {}),
    }),
  );
}
