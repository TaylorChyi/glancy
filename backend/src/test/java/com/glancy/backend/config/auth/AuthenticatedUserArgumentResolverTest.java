package com.glancy.backend.config.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.glancy.backend.entity.User;
import com.glancy.backend.exception.UnauthorizedException;
import com.glancy.backend.service.UserService;
import java.lang.reflect.Method;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.NativeWebRequest;

@ExtendWith(MockitoExtension.class)
class AuthenticatedUserArgumentResolverTest {

    private static final NativeWebRequest WEB_REQUEST = mock(NativeWebRequest.class);

    private AuthenticatedUserArgumentResolver resolver;

    @Mock
    private UserService userService;

    private MethodParameter userIdParameter;

    private MethodParameter userParameter;

    @BeforeEach
    void setUp() throws NoSuchMethodException {
        resolver = new AuthenticatedUserArgumentResolver(userService);
        Method idMethod = FixtureController.class.getMethod("handleWithId", Long.class);
        Method userMethod = FixtureController.class.getMethod("handleWithUser", User.class);
        userIdParameter = new MethodParameter(idMethod, 0);
        userParameter = new MethodParameter(userMethod, 0);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /**
     * 验证当 principal 为 Long 时，解析器能够返回匹配的用户实体。
     */
    @Test
    void resolveArgumentReturnsUserWhenPrincipalIsLong() throws Exception {
        User expectedUser = new User();
        expectedUser.setId(9L);
        expectedUser.setUsername("architect");
        SecurityContextHolder
            .getContext()
            .setAuthentication(new UsernamePasswordAuthenticationToken(9L, "token"));
        when(userService.getUserRaw(9L)).thenReturn(expectedUser);

        Object resolved = resolver.resolveArgument(userParameter, null, WEB_REQUEST, null);

        assertThat(resolved).isSameAs(expectedUser);
        verify(userService).getUserRaw(9L);
    }

    /**
     * 验证当 principal 不是 Long（例如匿名用户字符串）时，解析器会抛出 UnauthorizedException。
     */
    @Test
    void resolveArgumentRejectsNonNumericPrincipal() {
        SecurityContextHolder
            .getContext()
            .setAuthentication(new TestingAuthenticationToken("anonymousUser", null));

        assertThatThrownBy(() -> resolver.resolveArgument(userIdParameter, null, WEB_REQUEST, null))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Missing authentication token");
    }

    private static class FixtureController {

        void handleWithId(@AuthenticatedUser Long userId) {}

        void handleWithUser(@AuthenticatedUser User user) {}
    }
}
