/* eslint-env jest */
import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import { ApiError } from "@shared/api/client.js";

const playSpy = jest.fn().mockResolvedValue();
const audioPool = [];
let audioB64;

const resetSharedMocks = () => {
  speakWord.mockReset();
  playSpy.mockClear();
  audioPool.length = 0;
  global.URL.createObjectURL.mockClear();
  global.URL.revokeObjectURL.mockClear();
};

const createPlayerHook = () => renderHook(() => useTtsPlayer());

const playWithAct = (result, payload) =>
  act(async () => {
    await result.current.play(payload);
  });

const emitPause = () =>
  act(() => {
    audioPool[0]?.__handlers.pause?.();
  });

const getAudioResponse = (overrides = {}) => ({
  data: audioB64,
  format: "mp3",
  ...overrides,
});

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
    const audio = {
      play: playSpy,
      pause: jest.fn(() => handlers.pause?.()),
      addEventListener: jest.fn((e, cb) => {
        handlers[e] = cb;
      }),
      removeEventListener: jest.fn((e) => {
        delete handlers[e];
      }),
      __handlers: handlers,
      src: "",
      currentTime: 0,
    };
    audioPool.push(audio);
    return audio;
  });
});

afterAll(() => {
  global.Audio.mockReset?.();
});

// mock useApi to supply tts methods
const speakWord = jest.fn();
jest.unstable_mockModule("@shared/hooks/useApi.js", () => ({
  useApi: () => ({ tts: { speakWord } }),
}));
jest.unstable_mockModule("@core/store", () => ({
  useUserStore: (sel) => sel({ user: { id: "1", token: "t" } }),
}));

const { useTtsPlayer } = await import("@shared/hooks/useTtsPlayer.js");

afterEach(resetSharedMocks);

describe("useTtsPlayer play", () => {
  /**
   * Ensures shortcut request retries with shortcut=false when server responds 204
   * and that all parameters are forwarded correctly.
   */
  test("retries with fallback when cache miss", async () => {
    speakWord.mockResolvedValueOnce(new Response(null, { status: 204 }));
    speakWord.mockResolvedValueOnce(getAudioResponse());

    const { result } = createPlayerHook();

    await playWithAct(result, { text: "hi", lang: "en", voice: "v1" });

    const payload = {
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

    const { result } = createPlayerHook();

    await playWithAct(result, { text: "hi", lang: "en" });

    expect(result.current.error).toEqual({
      code: 401,
      message: "请登录后重试",
    });
  });
});

describe("useTtsPlayer stop", () => {
  /**
   * Verifies stop pauses audio and resets playing flag.
   */
  test("halts playback", async () => {
    speakWord.mockResolvedValueOnce(getAudioResponse());
    const { result } = createPlayerHook();

    await playWithAct(result, { text: "hi", lang: "en" });
    expect(result.current.playing).toBe(true);

    await act(() => {
      result.current.stop();
    });
    expect(audioPool[0].pause).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    expect(result.current.playing).toBe(false);
  });

  /**
   * Ensures a new play request pauses the previous audio element.
   */
  test("pauses previous audio on new play", async () => {
    speakWord.mockResolvedValue(getAudioResponse());
    const first = createPlayerHook();
    await playWithAct(first.result, { text: "a", lang: "en" });

    const second = createPlayerHook();
    await playWithAct(second.result, { text: "b", lang: "en" });
    expect(audioPool[0].pause).toHaveBeenCalled();
  });
});

describe("useTtsPlayer resume", () => {
  /**
   * When playback was paused but the buffer is still in memory,
   * the hook should resume without hitting the network again.
   */
  test("reuses buffered audio", async () => {
    speakWord.mockResolvedValue(getAudioResponse());
    const { result } = createPlayerHook();

    await playWithAct(result, { text: "hi", lang: "en" });
    expect(speakWord).toHaveBeenCalledTimes(1);

    await emitPause();

    await playWithAct(result, { text: "hi", lang: "en" });
    expect(speakWord).toHaveBeenCalledTimes(1);
    expect(playSpy).toHaveBeenCalledTimes(2);
  });
});
