package com.glancy.backend.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class HttpStatusAwareErrorMessageResolverTest {

  private final HttpStatusAwareErrorMessageResolver resolver =
      HttpStatusAwareErrorMessageResolver.defaultResolver();

  /**
   * 测试目标：确认解析器会将 502 Bad Gateway 的内部文案替换为约定的中文提示语。 前置条件：初始化默认策略解析器实例。 步骤： 1) 调用 resolver.resolve 传入
   * HttpStatus.BAD_GATEWAY 与任意原始消息。 2) 获取返回的友好文案。 断言： - 解析结果等于「上游服务暂时不可用，请稍后重试」。 边界/异常： - 若策略未覆盖
   * 502，将回落到通用逻辑导致断言失败，提示策略链配置缺失。
   */
  @Test
  void GivenBadGatewayStatus_WhenResolve_ThenReturnFriendlyMessage() {
    String resolved = resolver.resolve(HttpStatus.BAD_GATEWAY, "Bad Gateway");

    assertThat(resolved).isEqualTo("上游服务暂时不可用，请稍后重试");
  }
}
