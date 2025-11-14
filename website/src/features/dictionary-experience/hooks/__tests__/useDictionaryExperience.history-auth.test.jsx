import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  mockUserState,
  mockNavigate,
  mockHistoryApi,
  mockGetRecord,
  mockGetEntry,
  mockFetchWordWithHandling,
  useDataGovernanceStore,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

describe("useDictionaryExperience/history & auth", function historyAuthSuite() {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  redirectWithoutAuthTest();
  correctedTermHistoryTest();
  skipHistoryWhenCaptureDisabledTest();
});

function redirectWithoutAuthTest() {
  /** Redirect to login when submitting without auth. */
  it("redirects to login when submitting without an authenticated user", async () => {
    mockUserState.user = null;
    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
    expect(mockHistoryApi.addHistory).not.toHaveBeenCalled();
  });
}

function correctedTermHistoryTest() {
  /**
   * Ensures history captures the corrected term when lookup normalizes input.
   */
  it("writes corrected term into history when lookup normalizes input", async () => {
    const correctedEntry = { term: "student", markdown: "definition" };
    mockFetchWordWithHandling.mockResolvedValueOnce({
      data: correctedEntry,
      error: null,
      language: "ENGLISH",
      flavor: "default",
    });
    mockGetRecord.mockReturnValue({ entry: correctedEntry });
    mockGetEntry.mockImplementation(() => correctedEntry);

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("studdent");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockHistoryApi.addHistory).toHaveBeenCalledTimes(1);
    expect(mockHistoryApi.addHistory.mock.calls[0][0]).toBe("student");
  });
}

function skipHistoryWhenCaptureDisabledTest() {
  /** Ensures no history write occurs when capture is disabled. */
  it("skips history addition when capture disabled", async () => {
    useDataGovernanceStore.setState({ historyCaptureEnabled: false });
    mockFetchWordWithHandling.mockResolvedValueOnce({
      data: { term: "mute", markdown: "md" },
      error: null,
      language: "ENGLISH",
      flavor: "default",
    });

    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("mute");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    expect(mockHistoryApi.addHistory).not.toHaveBeenCalled();
  });
}
