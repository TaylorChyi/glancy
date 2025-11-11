package com.glancy.backend.config.auth;

import com.glancy.backend.entity.User;
import com.glancy.backend.exception.UnauthorizedException;
import com.glancy.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.MethodParameter;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
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

    private static final String REQUEST_ATTR_USER_ID = "userId";

    private final ObjectProvider<UserService> userServiceProvider;

    public AuthenticatedUserArgumentResolver(ObjectProvider<UserService> userServiceProvider) {
        this.userServiceProvider = userServiceProvider;
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
        if (userId == null) {
            userId = resolveFromRequest(webRequest);
        }
        if (userId == null) {
            throw new UnauthorizedException(ERROR_MISSING_TOKEN);
        }
        if (Long.class.equals(parameter.getParameterType())) {
            return userId;
        }
        return resolveUserService().getUserRaw(userId);
    }

    private Long resolveUserId(@Nullable Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal == null) {
            return null;
        }
        if (principal instanceof Long longId) {
            return longId;
        }
        if (principal instanceof Number number) {
            return number.longValue();
        }
        if (principal instanceof String str) {
            if (str.isBlank()) {
                return null;
            }
            try {
                return Long.parseLong(str);
            } catch (NumberFormatException ex) {
                throw new UnauthorizedException(ERROR_INVALID_PRINCIPAL);
            }
        }
        throw new UnauthorizedException(ERROR_INVALID_PRINCIPAL);
    }

    private UserService resolveUserService() {
        UserService userService = userServiceProvider.getIfAvailable();
        if (userService == null) {
            throw new IllegalStateException(
                "UserService bean is required to resolve @AuthenticatedUser User parameters"
            );
        }
        return userService;
    }

    private Long resolveFromRequest(NativeWebRequest webRequest) {
        Object attribute = webRequest.getAttribute(REQUEST_ATTR_USER_ID, NativeWebRequest.SCOPE_REQUEST);
        Long userId = convertAttributeToLong(attribute);
        if (userId != null) {
            return userId;
        }
        HttpServletRequest servletRequest = webRequest.getNativeRequest(HttpServletRequest.class);
        if (servletRequest == null) {
            return null;
        }
        Object requestAttribute = servletRequest.getAttribute(REQUEST_ATTR_USER_ID);
        userId = convertAttributeToLong(requestAttribute);
        if (userId != null) {
            return userId;
        }
        String token = com.glancy.backend.config.auth.TokenResolver.resolveToken(servletRequest);
        if (!StringUtils.hasText(token)) {
            return null;
        }
        Long resolved = resolveUserService().authenticateToken(token);
        if (resolved == null) {
            throw new UnauthorizedException(ERROR_INVALID_PRINCIPAL);
        }
        return resolved;
    }

    private Long convertAttributeToLong(Object attribute) {
        if (attribute instanceof Long longId) {
            return longId;
        }
        if (attribute instanceof Number number) {
            return number.longValue();
        }
        if (attribute instanceof String str && StringUtils.hasText(str)) {
            try {
                return Long.parseLong(str.trim());
            } catch (NumberFormatException ex) {
                throw new UnauthorizedException(ERROR_INVALID_PRINCIPAL);
            }
        }
        return null;
    }
}
