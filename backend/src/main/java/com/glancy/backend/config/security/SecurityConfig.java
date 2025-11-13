package com.glancy.backend.config.security;

import com.glancy.backend.config.TokenAuthenticationFilter;
import com.glancy.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/** 安全配置（Spring Security，全拼 Security Framework）。 仅增加令牌追踪与失败日志，不改变现有鉴权与授权规则。 */
@Configuration
@Slf4j
public class SecurityConfig {

    private final UserService userService;

    public SecurityConfig(UserService userService) {
        this.userService = userService;
    }

    @Bean
    public TokenAuthenticationFilter tokenAuthenticationFilter() {
        return new TokenAuthenticationFilter(userService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                // 在匿名认证过滤器之前增加令牌追踪过滤器，确保所有请求都被记录
                .addFilterBefore(new TokenTraceFilter(), AnonymousAuthenticationFilter.class)
                .addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                // 异常处理：未认证与拒绝访问均打印原因；响应仍按现有策略使用 404
                .exceptionHandling(
                        e -> e.authenticationEntryPoint(authEntryPoint()).accessDeniedHandler(accessDeniedHandler()))
                .httpBasic(httpBasic -> {}); // 显式启用 httpBasic 认证

        // 其余既有安全规则保持不变（如有）
        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint authEntryPoint() {
        return (HttpServletRequest req,
                HttpServletResponse resp,
                org.springframework.security.core.AuthenticationException ex) -> {
            String rid = String.valueOf(req.getAttribute(TokenTraceFilter.ATTR_REQUEST_ID));
            String tokenStatus = String.valueOf(req.getAttribute(TokenTraceFilter.ATTR_TOKEN_STATUS));
            log.warn(
                    "RID={}, auth-failed, mappedTo=404, reason={}, tokenStatus={}",
                    rid,
                    ex.getClass().getSimpleName(),
                    tokenStatus);
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND); // 维持既有“伪装 404”策略
            resp.setContentType("application/json;charset=UTF-8");
            resp.getWriter().write("{\"message\":\"未找到资源\",\"rid\":\"" + rid + "\"}");
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (HttpServletRequest req, HttpServletResponse resp, AccessDeniedException ex) -> {
            String rid = String.valueOf(req.getAttribute(TokenTraceFilter.ATTR_REQUEST_ID));
            String tokenStatus = String.valueOf(req.getAttribute(TokenTraceFilter.ATTR_TOKEN_STATUS));
            log.warn(
                    "RID={}, access-denied, mappedTo=404, reason={}, tokenStatus={}",
                    rid,
                    ex.getClass().getSimpleName(),
                    tokenStatus);
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND); // 维持既有“伪装 404”策略
            resp.setContentType("application/json;charset=UTF-8");
            resp.getWriter().write("{\"message\":\"未找到资源\",\"rid\":\"" + rid + "\"}");
        };
    }

    @Bean
    public UserDetailsService users() {
        return new InMemoryUserDetailsManager(User.withUsername("admin")
                .password("{noop}password") // 明文密码，实际使用中应改为加密密码
                .roles("ADMIN")
                .build());
    }
}
