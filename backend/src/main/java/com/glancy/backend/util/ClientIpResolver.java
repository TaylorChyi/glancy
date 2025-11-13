package com.glancy.backend.util;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ClientIpResolver {

    private static final List<String> HEADER_CANDIDATES =
            List.of("X-Forwarded-For", "X-Real-IP", "CF-Connecting-IP", "True-Client-IP");

    /**
     * 意图：从 HTTP 请求中提取真实客户端 IP。 输入：request（当前 HTTP 请求）。 输出：字符串形式的 IP 地址，可能为 null 表示无法识别。 流程： 1)
     * 按顺序检查常见代理头部，取首个非空且合法的值； 2) 如头部包含多级代理，取第一段； 3) 若未命中，使用 {@link
     * HttpServletRequest#getRemoteAddr()} 作为兜底。 错误处理：捕获异常并返回 null，避免影响主流程。 复杂度：O(n)，n 为头部数量，常数极小。
     */
    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        for (String header : HEADER_CANDIDATES) {
            String candidate = request.getHeader(header);
            if (!StringUtils.hasText(candidate)) {
                continue;
            }
            String ip = extractFirst(candidate);
            if (StringUtils.hasText(ip)) {
                return ip;
            }
        }
        try {
            String remoteAddr = request.getRemoteAddr();
            return StringUtils.hasText(remoteAddr) ? remoteAddr : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String extractFirst(String headerValue) {
        return Arrays.stream(headerValue.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(null);
    }
}
