package com.glancy.backend.exception;

import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatus.Series;

public final class HttpStatusAwareErrorMessageResolver {

  private final List<ErrorMessageStrategy> strategies;

  public HttpStatusAwareErrorMessageResolver(List<ErrorMessageStrategy> strategies) {
    this.strategies = List.copyOf(strategies);
  }

  public static HttpStatusAwareErrorMessageResolver defaultResolver() {
    return new HttpStatusAwareErrorMessageResolver(
        List.of(
            new BadGatewayMessageStrategy(),
            new ServerErrorMessageStrategy(),
            new PassthroughMessageStrategy()));
  }

  public String resolve(HttpStatus status, String originalMessage) {
    for (ErrorMessageStrategy strategy : strategies) {
      if (strategy.supports(status)) {
        return strategy.toPublicMessage(originalMessage);
      }
    }
    return originalMessage;
  }

  interface ErrorMessageStrategy {
    boolean supports(HttpStatus status);

    String toPublicMessage(String originalMessage);
  }

  static final class BadGatewayMessageStrategy implements ErrorMessageStrategy {

    /**
     * 选择专门的 502 文案而不是复用通用 5xx 提示，是因为用户经常遇到的“Bad Gateway”来源于上游 LLM 或 词典供应商，直观说明“上游服务异常”更有助于定位问题。其他
     * 5xx 则仍走通用策略，避免过度拆分。
     */
    private static final String FRIENDLY_MESSAGE = "上游服务暂时不可用，请稍后重试";

    @Override
    public boolean supports(HttpStatus status) {
      return status == HttpStatus.BAD_GATEWAY;
    }

    @Override
    public String toPublicMessage(String originalMessage) {
      return FRIENDLY_MESSAGE;
    }
  }

  static final class ServerErrorMessageStrategy implements ErrorMessageStrategy {

    private static final String GENERIC_MESSAGE = "服务暂不可用，请稍后重试";

    @Override
    public boolean supports(HttpStatus status) {
      return status.series() == Series.SERVER_ERROR;
    }

    @Override
    public String toPublicMessage(String originalMessage) {
      return GENERIC_MESSAGE;
    }
  }

  static final class PassthroughMessageStrategy implements ErrorMessageStrategy {

    @Override
    public boolean supports(HttpStatus status) {
      return true;
    }

    @Override
    public String toPublicMessage(String originalMessage) {
      return Objects.requireNonNullElse(originalMessage, "");
    }
  }
}
