package com.glancy.backend.config.auth;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Utility for extracting the user authentication token from a request.
 */
public final class TokenResolver {

    public static final String HEADER_NAME = "X-USER-TOKEN";
    public static final String PARAM_NAME = "token";

    private TokenResolver() {}

    /**
     * Resolve the token from either the {@code X-USER-TOKEN} header or the
     * {@code token} query parameter.
     *
     * @param request the current HTTP request
     * @return the token value or {@code null} if not found
     */
    public static String resolveToken(HttpServletRequest request) {
        String token = request.getHeader(HEADER_NAME);
        if (token == null || token.isEmpty()) {
            token = request.getParameter(PARAM_NAME);
        }
        return (token == null || token.isEmpty()) ? null : token;
    }
}
