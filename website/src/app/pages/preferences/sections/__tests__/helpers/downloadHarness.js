import { jest } from "@jest/globals";

const ensureUrlMethod = (method, fallback) => {
  if (!window.URL[method]) {
    Object.defineProperty(window.URL, method, {
      configurable: true,
      writable: true,
      value: fallback,
    });
  }
};

const installUrlSpies = () => {
  ensureUrlMethod("createObjectURL", () => "");
  ensureUrlMethod("revokeObjectURL", () => undefined);
  const createUrl = jest
    .spyOn(window.URL, "createObjectURL")
    .mockReturnValue("blob:export");
  const revokeUrl = jest.spyOn(window.URL, "revokeObjectURL");
  const restore = () => {
    createUrl.mockRestore();
    revokeUrl.mockRestore();
  };
  return { createUrl, revokeUrl, restore };
};

const createBlobTracker = () => {
  const OriginalBlob = Blob;
  const blobCalls = [];
  const blobSpy = jest
    .spyOn(globalThis, "Blob")
    .mockImplementation((parts = [], options) => {
      blobCalls.push({ parts, options });
      return Reflect.construct(OriginalBlob, [parts, options]);
    });
  const getCsvText = () =>
    (blobCalls[0]?.parts ?? [])
      .map((part) => (typeof part === "string" ? part : ""))
      .join("");
  const restore = () => {
    blobSpy.mockRestore();
  };
  return { OriginalBlob, blobSpy, getCsvText, restore };
};

export const createDownloadHarness = () => {
  const urlSpies = installUrlSpies();
  const appendSpy = jest.spyOn(document.body, "appendChild");
  const removeSpy = jest.spyOn(Element.prototype, "remove");
  const blobTracker = createBlobTracker();
  const restore = () => {
    urlSpies.restore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    blobTracker.restore();
  };
  return {
    createUrl: urlSpies.createUrl,
    revokeUrl: urlSpies.revokeUrl,
    appendSpy,
    removeSpy,
    OriginalBlob: blobTracker.OriginalBlob,
    getCsvText: blobTracker.getCsvText,
    restore,
  };
};
