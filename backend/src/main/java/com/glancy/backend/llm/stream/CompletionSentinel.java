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
        int markerIndex = locateTerminalMarker(content);
        if (markerIndex < 0) {
            return new CompletionCheck(false, content);
        }
        String withoutMarker = content.substring(0, markerIndex);
        return new CompletionCheck(true, withoutMarker);
    }

    /**
     * 意图：在不改写正文空白字符的前提下定位终止哨兵。
     * 输入：模型原始输出文本。
     * 输出：若末尾存在独立一行的哨兵，返回其起始下标；否则返回 -1。
     * 流程：
     *  1) 选择末次出现的哨兵；
     *  2) 仅允许哨兵之后出现换行符，避免吞掉后续有效字符。
     * 复杂度：O(n)。
     */
    private static int locateTerminalMarker(String content) {
        int markerIndex = content.lastIndexOf(MARKER);
        if (markerIndex < 0) {
            return -1;
        }
        if (!hasOnlyLineBreaksAfterMarker(content, markerIndex + MARKER.length())) {
            return -1;
        }
        return markerIndex;
    }

    private static boolean hasOnlyLineBreaksAfterMarker(String content, int startIndex) {
        for (int i = startIndex; i < content.length(); i++) {
            char ch = content.charAt(i);
            if (ch != '\n' && ch != '\r') {
                return false;
            }
        }
        return true;
    }

    /**
     * 记录哨兵检测结果，包含是否命中以及可直接消费的正文文本。
     */
    public record CompletionCheck(boolean satisfied, String sanitizedContent) {}
}
