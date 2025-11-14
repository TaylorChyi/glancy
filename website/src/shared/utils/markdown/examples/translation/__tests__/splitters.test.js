import {
  assembleFollowingTranslationResult,
  findInlineTranslationMatch,
  normalizeExampleLine,
  normalizeInlineSegments,
  parseTranslationLine,
  sanitizeTranslationSegments,
  shouldUseSanitizedSegments,
  splitFollowingTranslation,
  splitInlineTranslation,
} from "../splitters.js";

describe("findInlineTranslationMatch", () => {
  it("returns null when no translation label is present", () => {
    expect(findInlineTranslationMatch("no labels here")).toBeNull();
  });

  it("skips non-translation labels", () => {
    expect(findInlineTranslationMatch("**example**: text")).toBeNull();
  });

  it("captures the start index including boundary characters", () => {
    const match = findInlineTranslationMatch("**translation**: value");
    expect(match).not.toBeNull();
    expect(match.startIndex).toBe(0);
  });
});

describe("normalizeInlineSegments", () => {
  it("normalizes wrapper punctuation from both segments", () => {
    const result = normalizeInlineSegments(
      "- ",
      "Example (",
      "translation)",
    );
    expect(result).toEqual({
      exampleLine: "- Example",
      translationSegment: "translation",
    });
  });
});

describe("normalizeExampleLine", () => {
  it("strips trailing whitespace and retains indentation", () => {
    expect(normalizeExampleLine("  * ", "Example   ")).toBe("  * Example");
    expect(normalizeExampleLine("  * ", "")).toBe("  *");
  });
});

describe("parseTranslationLine", () => {
  it("accepts ASCII and full-width separators", () => {
    expect(parseTranslationLine("**translation**: hello")).not.toBeNull();
    expect(parseTranslationLine("translation：hola")).not.toBeNull();
  });

  it("rejects lines without a translation label", () => {
    expect(parseTranslationLine("**example**: hola")).toBeNull();
  });
});

describe("shouldUseSanitizedSegments", () => {
  it("requires either the example or translation to change", () => {
    const originalExample = "Example (";
    const originalTranslation = "translation)";
    const sanitized = sanitizeTranslationSegments(
      originalExample,
      originalTranslation,
    );
    expect(
      shouldUseSanitizedSegments(
        originalExample,
        originalTranslation,
        sanitized,
      ),
    ).toBe(true);
    expect(
      shouldUseSanitizedSegments(
        "Example",
        "translation",
        sanitized,
      ),
    ).toBe(false);
  });
});

describe("assembleFollowingTranslationResult", () => {
  it("normalizes trailing whitespace on both lines", () => {
    const sanitized = {
      exampleBody: "Example",
      translationSegment: "translation: value",
    };
    const result = assembleFollowingTranslationResult(
      "* ",
      sanitized,
      "    translation: value   ",
      "translation: value   ",
    );
    expect(result).toEqual({
      exampleLine: "* Example",
      translationLine: "    translation: value",
    });
  });
});

describe("integration", () => {
  it("returns inline translation segments when available", () => {
    expect(splitInlineTranslation("- ", "Example **translation**: value")).toEqual({
      exampleLine: "- Example",
      translationSegment: "**translation**: value",
    });
  });

  it("returns following translation when wrappers are stripped", () => {
    const prefix = "- ";
    const rest = "Example （";
    expect(splitInlineTranslation(prefix, rest)).toBeNull();
    expect(
      splitFollowingTranslation(prefix, rest.trimEnd(), "  translation：hola）"),
    ).toEqual({
      exampleLine: "- Example",
      translationLine: "  translation：hola",
    });
  });
});
