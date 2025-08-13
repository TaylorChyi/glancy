package com.glancy.backend.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 令牌追踪过滤器：只负责记录令牌状态与请求标识，不改变既有鉴权结果。
 * 作用：在进入安全链（Security Chain，安全链）与控制器之前，区分令牌状态并写入日志。
 */
@Slf4j
public class TokenTraceFilter extends OncePerRequestFilter {

    /** 自定义令牌请求头名称（HTTP，HyperText Transfer Protocol 头部不区分大小写） */
    public static final String HDR_TOKEN = "x-user-token";

    /** 供下游读取的请求属性键（Attributes，属性） */
    public static final String ATTR_TOKEN_STATUS = "auth.token.status";
    public static final String ATTR_TOKEN_SUBJECT = "auth.token.sub";
    public static final String ATTR_REQUEST_ID = "req.id";

    /** 令牌状态枚举，用于日志标注 */
    public enum TokenStatus {
        MISSING,
        MALFORMED,
        EXPIRED,
        REVOKED,
        OK,
    }

    /** 令牌校验结果载体 */
    public record TokenCheckResult(TokenStatus status, String subject) {}

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
        throws ServletException, IOException {
        // 生成请求链路标识（Request ID，请求标识），用于串联单次请求的日志
        String rid = UUID.randomUUID().toString();
        MDC.put("rid", rid);
        req.setAttribute(ATTR_REQUEST_ID, rid);

        String token = req.getHeader(HDR_TOKEN);
        TokenStatus status;
        String subject = null;

        if (token == null || token.isBlank()) {
            status = TokenStatus.MISSING; // 缺失
        } else if (!looksLikeUuid(token)) {
            status = TokenStatus.MALFORMED; // 格式错误
        } else {
            // 令牌校验逻辑（示例占位）：请在此处替换为实际的签名校验、有效期校验、吊销表查询等
            TokenCheckResult r = checkToken(token);
            status = r.status();
            subject = r.subject();
        }

        // 将令牌状态与主体写入请求属性，供后续安全链与控制器读取
        req.setAttribute(ATTR_TOKEN_STATUS, status.name());
        if (subject != null) {
            req.setAttribute(ATTR_TOKEN_SUBJECT, subject);
        }

        // 入口汇总日志：记录方法、路径、令牌状态与主体（如可判定）
        log.info(
            "RID={}, method={}, path={}, tokenStatus={}, subject={}",
            rid,
            req.getMethod(),
            req.getRequestURI(),
            status,
            subject
        );

        try {
            chain.doFilter(req, resp);
        } finally {
            MDC.remove("rid");
        }
    }

    // 简单格式校验：示例按 UUID（Universally Unique Identifier，通用唯一标识符）形态校验
    private boolean looksLikeUuid(String token) {
        try {
            UUID.fromString(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 示例校验：请替换为真实逻辑（签名、过期时间、吊销状态等）
    private TokenCheckResult checkToken(String token) {
        if (token.startsWith("98ef")) {
            // 示例：以 98ef 开头视为有效
            return new TokenCheckResult(TokenStatus.OK, "u-unknown");
        }
        return new TokenCheckResult(TokenStatus.EXPIRED, null);
    }
}
