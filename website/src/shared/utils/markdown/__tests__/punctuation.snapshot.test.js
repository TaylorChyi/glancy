import { ensureEnglishPunctuationSpacing } from "../punctuation.js";

describe("ensureEnglishPunctuationSpacing", () => {
  test("adds visual spacing to english punctuation golden sample", () => {
    const sample = [
      "NASA.Launched rockets.HeSaid:GO",
      "`config.value.with.dots`should stay tight",
      "Score was 98.6 so no spacing",
      "Titles end.HeBegan a tale",
    ].join("\n");
    expect(ensureEnglishPunctuationSpacing(sample)).toMatchInlineSnapshot(`
"NASA.Launched rockets. HeSaid:GO
\`config.value.with.dots\`should stay tight
Score was 98.6 so no spacing
Titles end. HeBegan a tale"
`);
  });
});
