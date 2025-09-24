package com.glancy.backend.config.auth;

import com.glancy.backend.entity.User;
import com.glancy.backend.exception.UnauthorizedException;
import com.glancy.backend.service.UserService;
import org.springframework.core.MethodParameter;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Resolves parameters annotated with {@link AuthenticatedUser} by validating
 * the user token from request headers.
 */

@Component
public class AuthenticatedUserArgumentResolver implements HandlerMethodArgumentResolver {

    private static final String ERROR_MISSING_TOKEN = "Missing authentication token";

    private static final String ERROR_INVALID_PRINCIPAL = "Invalid authentication principal type";

    private final UserService userService;

    public AuthenticatedUserArgumentResolver(UserService userService) {
        this.userService = userService;
    }

    @Override
    public boolean supportsParameter(@NonNull MethodParameter parameter) {
        if (!parameter.hasParameterAnnotation(AuthenticatedUser.class)) {
            return false;
        }
        Class<?> type = parameter.getParameterType();
        return User.class.isAssignableFrom(type) || Long.class.equals(type);
    }

    @Override
    public Object resolveArgument(
        @NonNull MethodParameter parameter,
        @Nullable ModelAndViewContainer mavContainer,
        @NonNull NativeWebRequest webRequest,
        @Nullable WebDataBinderFactory binderFactory
    ) throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = resolveUserId(authentication);
        if (Long.class.equals(parameter.getParameterType())) {
            return userId;
        }
        return userService.getUserRaw(userId);
    }

    private Long resolveUserId(@Nullable Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException(ERROR_MISSING_TOKEN);
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long longId) {
            return longId;
        }
        if (principal instanceof Number number) {
            return number.longValue();
        }
        if (principal instanceof String str) {
            if (str.isBlank()) {
                throw new UnauthorizedException(ERROR_MISSING_TOKEN);
            }
            try {
                return Long.parseLong(str);
            } catch (NumberFormatException ex) {
                throw new UnauthorizedException(ERROR_INVALID_PRINCIPAL);
            }
        }
        throw new UnauthorizedException(ERROR_INVALID_PRINCIPAL);
    }
}
