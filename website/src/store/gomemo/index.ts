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
  loadPlan: (opts?: { token?: string | null }) => Promise<void>;
  selectWord: (index: number) => void;
  selectMode: (mode: string | null) => void;
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
  "plan" | "review" | "activeWordIndex" | "activeMode" | "loading" | "error"
> = {
  plan: null,
  review: null,
  activeWordIndex: 0,
  activeMode: null,
  loading: false,
  error: null,
};

export const useGomemoStore = createPersistentStore<GomemoState>({
  key: "gomemo",
  initializer: (set, get) => ({
    ...INITIAL_STATE,
    async loadPlan({ token } = {}) {
      set({ loading: true, error: null });
      try {
        const response = await api.gomemo.getPlan({
          token: token ?? undefined,
        });
        if (!response || typeof response !== "object") {
          throw new Error("无效的 Gomemo 返回值");
        }
        const plan: GomemoPlan = {
          sessionId: Number(response.sessionId),
          sessionDate: response.sessionDate,
          persona: response.persona,
          planHighlights: Array.isArray(response.planHighlights)
            ? response.planHighlights
            : [],
          words: Array.isArray(response.words) ? response.words : [],
          modes: Array.isArray(response.modes) ? response.modes : [],
          progress: response.progress,
        };
        const firstWord = plan.words[0];
        const initialMode =
          firstWord?.recommendedModes?.[0] ?? plan.modes?.[0]?.type ?? null;
        set({
          plan,
          review: null,
          activeWordIndex: 0,
          activeMode: initialMode,
          loading: false,
        });
      } catch (error) {
        console.error(error);
        set({ error: error?.message ?? "加载失败", loading: false });
      }
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
    async recordProgress(payload, { token } = {}) {
      const state = get();
      if (!state.plan) return;
      await api.gomemo.postProgress({
        sessionId: state.plan.sessionId,
        payload,
        token: token ?? undefined,
      });
      const updated = await api.gomemo.getPlan({ token: token ?? undefined });
      if (updated?.progress) {
        set((current) => ({
          plan: current.plan
            ? { ...current.plan, progress: updated.progress }
            : current.plan,
        }));
      }
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
              ? { ...current.plan, progress: response.progress }
              : current.plan,
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
  persist: {
    serializer: {
      serialize: (state) =>
        JSON.stringify(pickState(state, ["plan", "review"])),
      deserialize: (value) => {
        if (!value) return { plan: null, review: null };
        try {
          return JSON.parse(value);
        } catch (error) {
          console.error(error);
          return { plan: null, review: null };
        }
      },
    },
  },
});
