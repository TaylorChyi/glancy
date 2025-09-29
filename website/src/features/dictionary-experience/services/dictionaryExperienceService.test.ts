import { describe, expect, it, jest } from "@jest/globals";
import {
  applyShareTemplate,
  attemptDictionaryShare,
  buildCopyPayload,
  buildReportTarget,
} from "./dictionaryExperienceService";

describe("dictionaryExperienceService", () => {
  it("buildCopyPayload prioritises markdown preview when available", () => {
    const result = buildCopyPayload({
      entry: { markdown: "**Hello**", term: "Hello" },
      finalText: "",
      streamText: "",
      fallbackTerm: "Fallback",
    });

    expect(result).toBe("**Hello**");
  });

  it("buildCopyPayload falls back to serialized entry when no markdown", () => {
    const result = buildCopyPayload({
      entry: { term: "World", notes: "sample" },
      finalText: "",
      streamText: "",
      fallbackTerm: "Fallback",
    });

    expect(result).toContain('"term": "World"');
  });

  it("applyShareTemplate interpolates term placeholder", () => {
    const result = applyShareTemplate({
      template: "分享 {term}",
      fallback: "Hello",
    });
    expect(result).toBe("分享 Hello");
  });

  it("attemptDictionaryShare forwards shared result", async () => {
    const share = jest.fn(async () => ({ status: "shared" }));
    const result = await attemptDictionaryShare({
      term: "Hello",
      attemptShareLinkFn: share,
      resolveShareTargetFn: () => "https://example.com",
    });
    expect(result).toEqual({ status: "shared" });
    expect(share).toHaveBeenCalledWith({
      title: "Hello",
      text: "Hello",
      url: "https://example.com",
    });
  });

  it("attemptDictionaryShare maps failed status", async () => {
    const result = await attemptDictionaryShare({
      term: "Hello",
      attemptShareLinkFn: async () => ({
        status: "failed",
        error: new Error("x"),
      }),
      resolveShareTargetFn: () => "https://example.com",
    });
    expect(result.status).toBe("failed");
  });

  it("buildReportTarget prefers configured form url", () => {
    const originRef = { current: "https://glancy.cn" };
    const target = buildReportTarget({
      reportFormUrl: "/report",
      supportEmail: "support@glancy.cn",
      term: "hello",
      currentUrl: "https://glancy.cn/dictionary",
      windowOriginRef: originRef,
    });

    expect(target).toContain("/report?");
    expect(target).toContain("term=hello");
  });

  it("buildReportTarget falls back to mailto when no form url", () => {
    const target = buildReportTarget({
      supportEmail: "support@glancy.cn",
      term: "hello",
    });

    expect(target.startsWith("mailto:")).toBe(true);
  });
});
