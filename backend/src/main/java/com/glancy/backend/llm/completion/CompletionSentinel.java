package com.glancy.backend.llm.completion;

public final class CompletionSentinel {

    public static final String MARKER = "<END>";

    private CompletionSentinel() {}

    public static CompletionCheck inspect(String content) {
        if (content == null) {
            return new CompletionCheck(false, null);
        }
        String trimmed = content.stripTrailing();
        if (!trimmed.endsWith(MARKER)) {
            return new CompletionCheck(false, content);
        }
        String withoutMarker = trimmed.substring(0, trimmed.length() - MARKER.length()).stripTrailing();
        return new CompletionCheck(true, withoutMarker);
    }

    public record CompletionCheck(boolean satisfied, String sanitizedContent) {}
}
