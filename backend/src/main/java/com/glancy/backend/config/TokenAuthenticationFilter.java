package com.glancy.backend.config;

import com.glancy.backend.config.auth.TokenResolver;
import com.glancy.backend.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Spring Security filter that validates the {@code X-USER-TOKEN} header and populates the
 * SecurityContext when the token is valid.
 */
public class TokenAuthenticationFilter extends OncePerRequestFilter {

  private final UserService userService;

  public TokenAuthenticationFilter(UserService userService) {
    this.userService = userService;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    String token = TokenResolver.resolveToken(request);
    if (token == null) {
      filterChain.doFilter(request, response);
      return;
    }

    try {
      Long userId = userService.authenticateToken(token);
      Authentication authentication =
          new UsernamePasswordAuthenticationToken(userId, token, List.of());
      SecurityContextHolder.getContext().setAuthentication(authentication);
      filterChain.doFilter(request, response);
    } catch (Exception ex) {
      response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid token");
    }
  }
}
