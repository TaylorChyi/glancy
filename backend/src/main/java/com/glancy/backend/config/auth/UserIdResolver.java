package com.glancy.backend.config.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.servlet.HandlerMapping;

/**
 * Utility for extracting the userId from path variables or query parameters.
 */
public final class UserIdResolver {

    private UserIdResolver() {}

    /**
     * Resolve the userId from URI template variables or the {@code userId}
     * query parameter.
     *
     * @param request current HTTP request
     * @return userId value or {@code null} if not found
     */
    public static String resolveUserId(HttpServletRequest request) {
        Map<String, String> pathVariables = null;
        Object attr = request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (attr instanceof Map<?, ?> map) {
            pathVariables = new HashMap<>();
            for (var entry : map.entrySet()) {
                pathVariables.put(entry.getKey().toString(), entry.getValue().toString());
            }
        }
        String userIdStr = null;
        if (pathVariables != null) {
            userIdStr = pathVariables.get("userId");
            if (userIdStr == null) {
                userIdStr = pathVariables.get("id");
            }
        }
        if (userIdStr == null) {
            userIdStr = request.getParameter("userId");
        }
        return userIdStr;
    }
}
