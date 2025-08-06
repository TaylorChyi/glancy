package com.glancy.backend.config.auth;

import com.glancy.backend.config.auth.TokenResolver;
import com.glancy.backend.config.auth.UserIdResolver;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.BusinessException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.UnauthorizedException;
import com.glancy.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
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
        HttpServletRequest request = (HttpServletRequest) webRequest.getNativeRequest();
        String token = TokenResolver.resolveToken(request);
        if (token == null) {
            throw new UnauthorizedException("Missing authentication token");
        }

        String userIdStr = UserIdResolver.resolveUserId(request);
        if (userIdStr == null) {
            throw new InvalidRequestException("Missing userId");
        }
        Long userId = Long.valueOf(userIdStr);
        try {
            userService.validateToken(userId, token);
        } catch (BusinessException ex) {
            throw new UnauthorizedException("Invalid token");
        }

        if (Long.class.equals(parameter.getParameterType())) {
            return userId;
        }
        return userService.getUserRaw(userId);
    }
}
