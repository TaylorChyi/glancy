import api from "@/api/index.js";
import { createPersistentStore } from "../createPersistentStore.js";
import { pickState } from "../persistUtils.js";

export type GomemoStudyMode = {
  type: string;
  title: string;
  description: string;
  focus: string;
};

export type GomemoPriorityWord = {
  term: string;
  language: string;
  priority: number;
  rationales: string[];
  recommendedModes: string[];
};

export type GomemoProgressDetail = {
  term: string;
  mode: string;
  attempts: number;
  retentionScore: number;
};

export type GomemoProgressSnapshot = {
  completedWords: number;
  totalWords: number;
  retentionAverage: number;
  details: GomemoProgressDetail[];
};

export type GomemoPersona = {
  descriptor: string;
  audience: string;
  tone: string;
  dailyTarget: number;
  goal?: string | null;
  futurePlan?: string | null;
  interests: string[];
};

export type GomemoPlan = {
  sessionId: number;
  sessionDate: string;
  persona: GomemoPersona;
  planHighlights: string[];
  words: GomemoPriorityWord[];
  modes: GomemoStudyMode[];
  progress: GomemoProgressSnapshot;
};

export type GomemoReview = {
  review: string;
  nextFocus: string;
};

type GomemoState = {
  plan: GomemoPlan | null;
  review: GomemoReview | null;
  activeWordIndex: number;
  activeMode: string | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number;
  loadPlanPromise: Promise<void> | null;
  progressPromise: Promise<void> | null;
  loadPlan: (opts?: {
    token?: string | null;
    force?: boolean;
  }) => Promise<void>;
  selectWord: (index: number) => void;
  selectMode: (mode: string | null) => void;
  syncProgress: (opts?: { token?: string | null }) => Promise<void>;
  recordProgress: (
    payload: {
      term: string;
      language: string;
      mode: string;
      attempts: number;
      successes: number;
      retentionScore: number;
      note?: string;
    },
    opts?: { token?: string | null },
  ) => Promise<void>;
  finalizeSession: (opts?: {
    token?: string | null;
  }) => Promise<GomemoReview | null>;
  reset: () => void;
};

const INITIAL_STATE: Pick<
  GomemoState,
  | "plan"
  | "review"
  | "activeWordIndex"
  | "activeMode"
  | "loading"
  | "error"
  | "lastFetchedAt"
  | "loadPlanPromise"
  | "progressPromise"
> = {
  plan: null,
  review: null,
  activeWordIndex: 0,
  activeMode: null,
  loading: false,
  error: null,
  lastFetchedAt: 0,
  loadPlanPromise: null,
  progressPromise: null,
};

type PersistedKey = "plan" | "review";

type PersistedState = Pick<GomemoState, PersistedKey>;

const PERSISTED_KEYS: PersistedKey[] = ["plan", "review"];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const deriveInitialMode = (plan: GomemoPlan | null): string | null => {
  if (!plan) return null;
  const firstWord = plan.words?.[0];
  if (firstWord?.recommendedModes?.length) {
    return firstWord.recommendedModes[0];
  }
  return plan.modes?.[0]?.type ?? null;
};

const PLAN_STALE_TTL_MS = 2 * 60 * 1000;

const normalizePlan = (payload: unknown): GomemoPlan => {
  if (!isObject(payload)) {
    throw new Error("无效的 Gomemo 返回值");
  }
  const {
    sessionId,
    sessionDate,
    persona,
    planHighlights,
    words,
    modes,
    progress,
  } = payload;
  if (
    sessionId == null ||
    sessionDate == null ||
    !isObject(persona) ||
    !isObject(progress)
  ) {
    throw new Error("无效的 Gomemo 返回值");
  }
  return {
    sessionId: Number(sessionId),
    sessionDate: String(sessionDate),
    persona: persona as GomemoPersona,
    planHighlights: Array.isArray(planHighlights) ? planHighlights : [],
    words: Array.isArray(words) ? (words as GomemoPriorityWord[]) : [],
    modes: Array.isArray(modes) ? (modes as GomemoStudyMode[]) : [],
    progress: progress as GomemoProgressSnapshot,
  };
};

const isPersistedState = (value: unknown): value is PersistedState => {
  if (!isObject(value)) return false;
  return PERSISTED_KEYS.some((key) => key in value);
};

export const useGomemoStore = createPersistentStore<GomemoState>({
  key: "gomemo",
  initializer: (set, get) => ({
    ...INITIAL_STATE,
    async loadPlan({ token, force = false } = {}) {
      const now = Date.now();
      const state = get();
      const isFresh =
        !force &&
        state.plan !== null &&
        now - state.lastFetchedAt < PLAN_STALE_TTL_MS;
      if (isFresh) {
        return;
      }

      if (state.loading) {
        return state.loadPlanPromise ?? Promise.resolve();
      }

      if (state.loadPlanPromise) {
        return state.loadPlanPromise;
      }

      set({ loading: true, error: null });
      const request = api.gomemo
        .getPlan({
          token: token ?? undefined,
        })
        .then((response) => {
          const plan = normalizePlan(response);
          set({
            plan,
            review: null,
            activeWordIndex: 0,
            activeMode: deriveInitialMode(plan),
            lastFetchedAt: Date.now(),
          });
        })
        .catch((error) => {
          console.error(error);
          set({ error: error?.message ?? "加载失败" });
        })
        .finally(() => {
          set({ loading: false, loadPlanPromise: null });
        });

      set({ loadPlanPromise: request });
      await request;
    },
    selectWord(index) {
      const state = get();
      if (!state.plan) return;
      const nextIndex = Math.max(
        0,
        Math.min(index, state.plan.words.length - 1),
      );
      const nextWord = state.plan.words[nextIndex];
      const nextMode = nextWord?.recommendedModes?.[0] ?? state.activeMode;
      set({ activeWordIndex: nextIndex, activeMode: nextMode ?? null });
    },
    selectMode(mode) {
      set({ activeMode: mode });
    },
    async syncProgress({ token } = {}) {
      const state = get();
      if (!state.plan) return;
      if (state.progressPromise) {
        await state.progressPromise;
        return;
      }
      const request = api.gomemo
        .getPlan({ token: token ?? undefined })
        .then((updated) => {
          if (updated?.progress) {
            set((current) => ({
              plan: current.plan
                ? { ...current.plan, progress: updated.progress }
                : current.plan,
              lastFetchedAt: Date.now(),
            }));
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          set({ progressPromise: null });
        });
      set({ progressPromise: request });
      await request;
    },
    async recordProgress(payload, { token } = {}) {
      const state = get();
      if (!state.plan) return;
      await api.gomemo.postProgress({
        sessionId: state.plan.sessionId,
        payload,
        token: token ?? undefined,
      });
      await state.syncProgress({ token });
    },
    async finalizeSession({ token } = {}) {
      const state = get();
      if (!state.plan) return null;
      const response = await api.gomemo.finalize({
        sessionId: state.plan.sessionId,
        token: token ?? undefined,
      });
      if (response && typeof response === "object") {
        const review: GomemoReview = {
          review: response.review ?? "",
          nextFocus: response.nextFocus ?? "",
        };
        set({ review });
        if (response.progress) {
          set((current) => ({
            plan: current.plan
              ? {
                  ...current.plan,
                  progress: response.progress,
                }
              : current.plan,
            lastFetchedAt: Date.now(),
          }));
        }
        return review;
      }
      return null;
    },
    reset() {
      set({ ...INITIAL_STATE });
    },
  }),
  persistOptions: {
    partialize: pickState<GomemoState, PersistedKey>(PERSISTED_KEYS),
    merge: (persisted, current) => {
      if (!isPersistedState(persisted)) {
        return current;
      }
      const plan = persisted.plan ?? null;
      return {
        ...current,
        ...persisted,
        plan,
        activeWordIndex: 0,
        activeMode: deriveInitialMode(plan),
        loading: false,
        error: null,
        lastFetchedAt: 0,
        loadPlanPromise: null,
        progressPromise: null,
      };
    },
  },
});
