import { act } from "@testing-library/react";
import { useVoiceStore, STORE_KEYS } from "@core/store";

/**
 * Voice store persistence and retrieval.
 */
describe("voiceStore", () => {
  beforeEach(() => localStorage.clear());

  test("setVoice persists voice per language", () => {
    act(() => useVoiceStore.getState().setVoice("en", "v1"));
    expect(useVoiceStore.getState().getVoice("en")).toBe("v1");
    const stored = JSON.parse(localStorage.getItem(STORE_KEYS.VOICE));
    expect(stored.state.voices.en).toBe("v1");
  });
});
