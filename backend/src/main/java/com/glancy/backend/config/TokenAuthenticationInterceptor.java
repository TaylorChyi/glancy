package com.glancy.backend.config;

import com.glancy.backend.config.auth.TokenResolver;
import com.glancy.backend.config.auth.UserIdResolver;
import com.glancy.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor that validates the {@code X-USER-TOKEN} header for requests
 * targeting user-specific endpoints.
 */
@Component
public class TokenAuthenticationInterceptor implements HandlerInterceptor {

    private final UserService userService;

    public TokenAuthenticationInterceptor(UserService userService) {
        this.userService = userService;
    }

    @Override
    public boolean preHandle(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull Object handler
    ) throws Exception {
        String token = TokenResolver.resolveToken(request);
        if (token == null) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing authentication token");
            return false;
        }

        String userIdStr = UserIdResolver.resolveUserId(request);
        if (userIdStr == null) {
            response.sendError(HttpStatus.BAD_REQUEST.value(), "Missing userId");
            return false;
        }
        try {
            Long userId = Long.valueOf(userIdStr);
            userService.validateToken(userId, token);
            return true;
        } catch (Exception ex) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid token");
            return false;
        }
    }
}
