package com.glancy.backend.config;

import com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** General web configuration including CORS and token authentication. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final AuthenticatedUserArgumentResolver authenticatedUserArgumentResolver;

  public WebConfig(AuthenticatedUserArgumentResolver authenticatedUserArgumentResolver) {
    this.authenticatedUserArgumentResolver = authenticatedUserArgumentResolver;
  }

  @Override
  public void addCorsMappings(@NonNull CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOriginPatterns("*")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);
  }

  @Override
  public void addArgumentResolvers(@NonNull List<HandlerMethodArgumentResolver> resolvers) {
    resolvers.add(authenticatedUserArgumentResolver);
  }
}
