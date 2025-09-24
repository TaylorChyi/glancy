import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from "zustand/middleware";
import type { StateCreator, StoreApi, UseBoundStore } from "zustand";

interface Options<T> {
  key: string;
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
      storage: createJSONStorage(() => localStorage),
      ...(persistOptions ?? {}),
    }),
  );
}
