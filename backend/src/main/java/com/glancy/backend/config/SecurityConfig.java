package com.glancy.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.glancy.backend.service.UserService;

@Configuration
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
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth ->
                auth.requestMatchers("/api/notifications/system").authenticated().anyRequest().permitAll()
            )
            .addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            .httpBasic(httpBasic -> {}); // 显式启用 httpBasic 认证
        return http.build();
    }

    @Bean
    public UserDetailsService users() {
        return new InMemoryUserDetailsManager(
            User.withUsername("admin")
                .password("{noop}password") // 明文密码，实际使用中应改为加密密码
                .roles("ADMIN")
                .build()
        );
    }
}
