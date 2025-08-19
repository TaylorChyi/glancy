import { decodeTtsAudio } from "./audio.js";

describe("decodeTtsAudio", () => {
  test("maps mp3 to audio/mpeg", () => {
    const base64 = btoa("audio");
    const blobSpy = jest.spyOn(global, "Blob");
    decodeTtsAudio({ data: base64, format: "mp3" });
    expect(blobSpy).toHaveBeenCalledWith(expect.any(Array), {
      type: "audio/mpeg",
    });
    blobSpy.mockRestore();
  });

  test("strips data URI prefix", () => {
    const base64 = btoa("audio");
    const prefixed = `data:audio/mp3;base64,${base64}`;
    const blobSpy = jest.spyOn(global, "Blob");
    decodeTtsAudio({ data: prefixed, format: "mp3" });
    const call = blobSpy.mock.calls[0];
    expect(call[0][0]).toEqual(
      Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
    );
    blobSpy.mockRestore();
  });
});
