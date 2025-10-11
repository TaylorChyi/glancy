/**
 * 背景：
 *  - 业务侧反馈 502 Bad Gateway 返回的默认英文文案难以理解，需通过策略解析器覆盖为中文提示。
 * 目的：
 *  - 验证 HttpStatusAwareErrorMessageResolver 能够为 502 状态返回定制化易懂的对外文案。
 * 关键决策与取舍：
 *  - 通过单元测试直接调用解析器，避免引入 MVC 框架依赖，加速回归并聚焦策略正确性。
 * 影响范围：
 *  - 涉及的仅为错误消息解析逻辑，其他状态码及控制器行为保持不变。
 * 演进与TODO：
 *  - 后续若需支持更多特定状态的定制文案，可在测试中追加对应断言，防止策略回归。
 */
package com.glancy.backend.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class HttpStatusAwareErrorMessageResolverTest {

    private final HttpStatusAwareErrorMessageResolver resolver = HttpStatusAwareErrorMessageResolver.defaultResolver();

    /**
     * 测试目标：确认解析器会将 502 Bad Gateway 的内部文案替换为约定的中文提示语。
     * 前置条件：初始化默认策略解析器实例。
     * 步骤：
     *  1) 调用 resolver.resolve 传入 HttpStatus.BAD_GATEWAY 与任意原始消息。
     *  2) 获取返回的友好文案。
     * 断言：
     *  - 解析结果等于「上游服务暂时不可用，请稍后重试」。
     * 边界/异常：
     *  - 若策略未覆盖 502，将回落到通用逻辑导致断言失败，提示策略链配置缺失。
     */
    @Test
    void GivenBadGatewayStatus_WhenResolve_ThenReturnFriendlyMessage() {
        String resolved = resolver.resolve(HttpStatus.BAD_GATEWAY, "Bad Gateway");

        assertThat(resolved).isEqualTo("上游服务暂时不可用，请稍后重试");
    }
}
