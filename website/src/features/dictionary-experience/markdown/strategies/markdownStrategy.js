import { normalizeDictionaryMarkdown } from "./shared.js";

export class MarkdownStrategy {
  supports(entry) {
    return Boolean(
      entry && typeof entry.markdown === "string" && entry.markdown.trim(),
    );
  }

  build(entry) {
    return normalizeDictionaryMarkdown(entry.markdown);
  }
}
