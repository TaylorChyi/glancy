import { jest } from "@jest/globals";
import { act } from "@testing-library/react";
import api from "@/api/index.js";
import { useGomemoStore } from "@/store/gomemo/index.ts";

const mockApi = api;

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
    mockApi.gomemo.getPlan.mockResolvedValue({
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
    mockApi.gomemo.getPlan.mockResolvedValueOnce({
      sessionId: 1,
      sessionDate: "2024-01-01",
      persona: {
        descriptor: "d",
        audience: "a",
        tone: "t",
        dailyTarget: 3,
        interests: [],
      },
      planHighlights: [],
      words: [
        {
          term: "align",
          language: "ENGLISH",
          priority: 8,
          rationales: [],
          recommendedModes: ["CARD"],
        },
      ],
      modes: [],
      progress: {
        completedWords: 0,
        totalWords: 1,
        retentionAverage: 0,
        details: [],
      },
    });
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
});
