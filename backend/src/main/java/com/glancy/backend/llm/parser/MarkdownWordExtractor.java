package com.glancy.backend.llm.parser;

final class MarkdownWordExtractor {

  private MarkdownWordExtractor() {}

  static MarkdownWordSnapshot extract(String markdown, String fallbackTerm) {
    if (markdown == null) {
      return MarkdownWordSnapshot.empty(fallbackTerm);
    }
    MarkdownSectionResolver resolver = MarkdownSectionResolver.defaultResolver();
    return new MarkdownWordProcessor(markdown, fallbackTerm, resolver).extract();
  }
}
