import { jest } from "@jest/globals";
import { act } from "@testing-library/react";
import api from "@/api/index.js";
import { useGomemoStore } from "@/store/gomemo/index.ts";

const mockApi = api;

const createPlanPayload = () => ({
  sessionId: 9,
  sessionDate: "2024-05-01",
  persona: {
    descriptor: "descriptor",
    audience: "audience",
    tone: "tone",
    dailyTarget: 5,
    interests: ["design"],
  },
  planHighlights: ["今日节奏：5 词"],
  words: [
    {
      term: "craft",
      language: "ENGLISH",
      priority: 10,
      rationales: ["近期检索优先复习"],
      recommendedModes: ["CARD"],
    },
  ],
  modes: [
    {
      type: "CARD",
      title: "卡片",
      description: "desc",
      focus: "focus",
    },
  ],
  progress: {
    completedWords: 0,
    totalWords: 1,
    retentionAverage: 0,
    details: [],
  },
});

const createDeferred = () => {
  let resolver;
  const promise = new Promise((res) => {
    resolver = res;
  });
  return {
    promise,
    resolve(value) {
      resolver?.(value);
    },
  };
};

describe("gomemo store", () => {
  beforeEach(() => {
    localStorage.clear();
    useGomemoStore.getState().reset();
    mockApi.gomemo = {
      getPlan: jest.fn(),
      postProgress: jest.fn(),
      finalize: jest.fn(),
    };
    jest.clearAllMocks();
  });

  /**
   * 验证加载计划时会保存会话信息并推导首个练习模式。
   */
  test("loadPlan hydrates state", async () => {
    mockApi.gomemo.getPlan.mockResolvedValue(createPlanPayload());

    await act(async () => {
      await useGomemoStore.getState().loadPlan();
    });

    const state = useGomemoStore.getState();
    expect(state.plan?.sessionId).toBe(9);
    expect(state.activeMode).toBe("CARD");
  });

  /**
   * 验证记录进度后会重新同步后端返回的快照。
   */
  test("recordProgress refreshes snapshot", async () => {
    const initialPlan = {
      ...createPlanPayload(),
      sessionId: 1,
      words: [
        {
          term: "align",
          language: "ENGLISH",
          priority: 8,
          rationales: [],
          recommendedModes: ["CARD"],
        },
      ],
    };
    mockApi.gomemo.getPlan.mockResolvedValueOnce(initialPlan);
    await act(async () => {
      await useGomemoStore.getState().loadPlan();
    });
    mockApi.gomemo.getPlan.mockResolvedValueOnce({
      progress: {
        completedWords: 1,
        totalWords: 1,
        retentionAverage: 90,
        details: [],
      },
    });

    await act(async () => {
      await useGomemoStore.getState().recordProgress(
        {
          term: "align",
          language: "ENGLISH",
          mode: "CARD",
          attempts: 1,
          successes: 1,
          retentionScore: 90,
        },
        {},
      );
    });

    expect(useGomemoStore.getState().plan?.progress.completedWords).toBe(1);
  });

  /**
   * 验证缓存期内重复调用不会再次触发远端请求，强制刷新可绕过缓存。
   */
  test("loadPlan uses freshness window", async () => {
    const plan = createPlanPayload();
    mockApi.gomemo.getPlan.mockResolvedValue(plan);

    await act(async () => {
      await useGomemoStore.getState().loadPlan();
    });

    expect(mockApi.gomemo.getPlan).toHaveBeenCalledTimes(1);

    mockApi.gomemo.getPlan.mockClear();

    await act(async () => {
      await useGomemoStore.getState().loadPlan();
    });

    expect(mockApi.gomemo.getPlan).not.toHaveBeenCalled();

    await act(async () => {
      await useGomemoStore.getState().loadPlan({ force: true });
    });

    expect(mockApi.gomemo.getPlan).toHaveBeenCalledTimes(1);
  });

  /**
   * 验证并发触发加载时会复用同一个请求承诺，避免重复请求。
   */
  test("loadPlan dedupes concurrent invocations", async () => {
    const deferred = createDeferred();
    const plan = createPlanPayload();
    mockApi.gomemo.getPlan.mockReturnValueOnce(deferred.promise);

    await act(async () => {
      const first = useGomemoStore.getState().loadPlan();
      const second = useGomemoStore.getState().loadPlan();
      expect(mockApi.gomemo.getPlan).toHaveBeenCalledTimes(1);
      deferred.resolve(plan);
      await Promise.all([first, second]);
    });

    expect(useGomemoStore.getState().plan?.sessionId).toBe(plan.sessionId);
  });

  /**
   * 验证进度刷新在并发场景下只会发起单个网络请求。
   */
  test("syncProgress collapses parallel refresh", async () => {
    const plan = createPlanPayload();
    mockApi.gomemo.getPlan.mockResolvedValueOnce(plan);
    await act(async () => {
      await useGomemoStore.getState().loadPlan();
    });

    mockApi.gomemo.getPlan.mockClear();
    const deferred = createDeferred();
    mockApi.gomemo.getPlan.mockReturnValueOnce(deferred.promise);

    await act(async () => {
      const first = useGomemoStore.getState().syncProgress();
      const second = useGomemoStore.getState().syncProgress();
      expect(mockApi.gomemo.getPlan).toHaveBeenCalledTimes(1);
      deferred.resolve({
        progress: {
          completedWords: 1,
          totalWords: 1,
          retentionAverage: 95,
          details: [],
        },
      });
      await Promise.all([first, second]);
    });

    expect(useGomemoStore.getState().plan?.progress.completedWords).toBe(1);
  });

  /**
   * 验证重新注入持久化数据时会清理 loading 状态并重建默认模式。
   */
  test("rehydrate clears transient flags", async () => {
    const planResponse = {
      sessionId: 7,
      sessionDate: "2024-05-10",
      persona: {
        descriptor: "descriptor",
        audience: "audience",
        tone: "tone",
        dailyTarget: 3,
        interests: ["product"],
      },
      planHighlights: [],
      words: [
        {
          term: "polish",
          language: "ENGLISH",
          priority: 9,
          rationales: ["近期语境高频"],
          recommendedModes: ["CARD"],
        },
      ],
      modes: [
        {
          type: "CARD",
          title: "卡片",
          description: "desc",
          focus: "focus",
        },
      ],
      progress: {
        completedWords: 0,
        totalWords: 1,
        retentionAverage: 0,
        details: [],
      },
    };
    mockApi.gomemo.getPlan.mockResolvedValue(planResponse);

    await act(async () => {
      await useGomemoStore.getState().loadPlan();
    });

    const { plan } = useGomemoStore.getState();
    expect(plan).not.toBeNull();

    useGomemoStore.getState().reset();

    const snapshot = JSON.stringify({
      state: { plan, review: null, loading: true },
      version: useGomemoStore.persist.getOptions().version ?? 0,
    });

    localStorage.setItem("gomemo", snapshot);

    await act(async () => {
      await useGomemoStore.persist.rehydrate();
    });

    const nextState = useGomemoStore.getState();
    expect(nextState.loading).toBe(false);
    expect(nextState.activeWordIndex).toBe(0);
    expect(nextState.activeMode).toBe("CARD");
  });
});
