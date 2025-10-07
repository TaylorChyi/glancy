package com.glancy.backend.util;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 背景：
 *  - 业务需要根据访问者 IP 进行邮件本地化，但不同部署拓扑中 IP 可能来自多种代理头部。
 * 目的：
 *  - 在控制器层提供统一的客户端 IP 解析能力，屏蔽代理链差异。
 * 关键决策与取舍：
 *  - 采用可配置顺序遍历常见头部，兼容多层反向代理；
 *  - 对非法或空值自动跳过，降级到 {@link HttpServletRequest#getRemoteAddr()}。
 * 影响范围：
 *  - 所有需要解析客户端 IP 的控制器可复用该工具组件。
 * 演进与TODO：
 *  - 后续可支持可信代理名单或自定义头部配置。
 */
@Component
public class ClientIpResolver {

    private static final List<String> HEADER_CANDIDATES = List.of(
        "X-Forwarded-For",
        "X-Real-IP",
        "CF-Connecting-IP",
        "True-Client-IP"
    );

    /**
     * 意图：从 HTTP 请求中提取真实客户端 IP。
     * 输入：request（当前 HTTP 请求）。
     * 输出：字符串形式的 IP 地址，可能为 null 表示无法识别。
     * 流程：
     *  1) 按顺序检查常见代理头部，取首个非空且合法的值；
     *  2) 如头部包含多级代理，取第一段；
     *  3) 若未命中，使用 {@link HttpServletRequest#getRemoteAddr()} 作为兜底。
     * 错误处理：捕获异常并返回 null，避免影响主流程。
     * 复杂度：O(n)，n 为头部数量，常数极小。
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
