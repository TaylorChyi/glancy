/* eslint-env jest */
import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import { ApiError } from "@/api/client.js";

// mock global Audio element with basic event system
const playSpy = jest.fn().mockResolvedValue();
const pauseSpies = [];
let audioB64;
beforeAll(() => {
  class MockResponse {
    constructor(_body, init = {}) {
      this.status = init.status;
    }
  }
  global.Response = MockResponse;
  global.URL.createObjectURL = jest.fn(() => "blob:mock");
  global.URL.revokeObjectURL = jest.fn();
  audioB64 = btoa("audio");
  global.Audio = jest.fn().mockImplementation(() => {
    const handlers = {};
    const pause = jest.fn(() => handlers.pause?.());
    pauseSpies.push(pause);
    return {
      play: playSpy,
      pause,
      addEventListener: jest.fn((e, cb) => {
        handlers[e] = cb;
      }),
      removeEventListener: jest.fn((e) => {
        delete handlers[e];
      }),
    };
  });
});

// mock useApi to supply tts methods
const speakWord = jest.fn();
jest.unstable_mockModule("@/hooks/useApi.js", () => ({
  useApi: () => ({ tts: { speakWord } }),
}));
jest.unstable_mockModule("@/store", () => ({
  useUserStore: (sel) => sel({ user: { id: "1" } }),
}));

const { useTtsPlayer } = await import("@/hooks/useTtsPlayer.js");

describe("useTtsPlayer", () => {
  afterEach(() => {
    speakWord.mockReset();
    playSpy.mockClear();
    pauseSpies.length = 0;
    global.URL.createObjectURL.mockClear();
    global.URL.revokeObjectURL.mockClear();
  });

  /**
   * Ensures shortcut request retries with shortcut=false when server responds 204
   * and that all parameters are forwarded correctly.
   */
  test("retries with fallback when cache miss", async () => {
    speakWord.mockResolvedValueOnce(new Response(null, { status: 204 }));
    speakWord.mockResolvedValueOnce({ data: audioB64, format: "mp3" });

    const { result } = renderHook(() => useTtsPlayer());

    await act(async () => {
      await result.current.play({ text: "hi", lang: "en", voice: "v1" });
    });

    const payload = {
      userId: "1",
      text: "hi",
      lang: "en",
      voice: "v1",
      speed: 1,
      format: "mp3",
      shortcut: true,
    };
    expect(speakWord).toHaveBeenNthCalledWith(1, payload);
    expect(speakWord).toHaveBeenNthCalledWith(2, {
      ...payload,
      shortcut: false,
    });
    expect(playSpy).toHaveBeenCalled();
  });

  /**
   * Confirms 401 errors prompt login feedback.
   */
  test("handles unauthorized error", async () => {
    speakWord.mockRejectedValueOnce(new ApiError(401, "Unauthorized"));

    const { result } = renderHook(() => useTtsPlayer());

    await act(async () => {
      await result.current.play({ text: "hi", lang: "en" });
    });

    expect(result.current.error).toEqual({
      code: 401,
      message: "请登录后重试",
    });
  });

  /**
   * Verifies stop pauses audio and resets playing flag.
   */
  test("stop halts playback", async () => {
    speakWord.mockResolvedValueOnce({ data: audioB64, format: "mp3" });
    const { result } = renderHook(() => useTtsPlayer());

    await act(async () => {
      await result.current.play({ text: "hi", lang: "en" });
    });
    expect(result.current.playing).toBe(true);

    await act(() => {
      result.current.stop();
    });
    expect(pauseSpies[0]).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    expect(result.current.playing).toBe(false);
  });

  /**
   * Ensures a new play request pauses the previous audio element.
   */
  test("new play pauses previous audio", async () => {
    speakWord.mockResolvedValue({ data: audioB64, format: "mp3" });
    const first = renderHook(() => useTtsPlayer());
    await act(async () => {
      await first.result.current.play({ text: "a", lang: "en" });
    });

    const second = renderHook(() => useTtsPlayer());
    await act(async () => {
      await second.result.current.play({ text: "b", lang: "en" });
    });
    expect(pauseSpies[0]).toHaveBeenCalled();
  });
});
