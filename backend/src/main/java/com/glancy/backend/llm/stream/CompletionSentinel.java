package com.glancy.backend.llm.stream;

/**
 * 统一管理流式输出的完成哨兵，便于检测模型是否给出可验证的终止符并剥离之。
 */
public final class CompletionSentinel {

    public static final String MARKER = "<END>";

    private CompletionSentinel() {}

    /**
     * 检查内容是否已包含完成哨兵，并在存在时返回剥离后的正文。
     */
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

    /**
     * 记录哨兵检测结果，包含是否命中以及可直接消费的正文文本。
     */
    public record CompletionCheck(boolean satisfied, String sanitizedContent) {}
}
