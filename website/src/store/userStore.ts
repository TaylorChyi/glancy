import {
  deriveMembershipSnapshot,
  type MembershipSnapshot,
} from "@/utils/membership";
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";

export interface User {
  id: string;
  token: string;
  avatar?: string;
  member?: boolean;
  membershipTier?: string | null;
  membershipExpiresAt?: string | null;
  plan?: string | null;
  [key: string]: unknown;
}

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  getMembershipSnapshot: () => MembershipSnapshot;
}

export const useUserStore = createPersistentStore<UserState>({
  key: "user",
  initializer: (set, get) => ({
    user: null,
    setUser: (user: User) => {
      set({ user });
    },
    clearUser: () => {
      set({ user: null });
    },
    getMembershipSnapshot: () => deriveMembershipSnapshot(get().user ?? null),
  }),
  persistOptions: {
    partialize: pickState(["user"]),
  },
});
