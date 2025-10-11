/**
 * 背景：
 *  - 针对 502 Bad Gateway 的错误文案需要改为可读性更强的提示语以降低用户困惑。
 * 目的：
 *  - 验证默认策略解析器能在 BAD_GATEWAY 状态下输出新的友好提示，确保配置生效。
 * 关键决策与取舍：
 *  - 直接调用解析器单元测试策略分派逻辑，避免引入 MockMvc 等额外依赖，保持测试原子性。
 * 影响范围：
 *  - 若解析器未返回预期提示，本测试会失败并阻止回归上线。
 * 演进与TODO：
 *  - 未来可补充多语言或动态配置场景的断言，保障策略扩展兼容性。
 */
package com.glancy.backend.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class HttpStatusAwareErrorMessageResolverTest {

    /**
     * 测试目标：确保默认解析器在 502 状态下返回新的友好提示语。
     * 前置条件：使用 HttpStatusAwareErrorMessageResolver.defaultResolver() 构造解析器实例。
     * 步骤：
     *  1) 调用 resolve(HttpStatus.BAD_GATEWAY, "upstream broke").
     *  2) 接收解析后的对外展示文案。
     * 断言：
     *  - 解析结果为 "中转服务短暂不可达，我们正在自动重试，请稍后再试"。
     * 边界/异常：
     *  - 若策略未生效，将返回原始文案导致断言失败，提示需要检查配置顺序或策略实现。
     */
    @Test
    void GivenBadGateway_WhenResolve_ThenReturnFriendlyMessage() {
        HttpStatusAwareErrorMessageResolver resolver = HttpStatusAwareErrorMessageResolver.defaultResolver();

        String message = resolver.resolve(HttpStatus.BAD_GATEWAY, "upstream broke");

        assertThat(message)
            .as("502 需返回用户易懂的提示语，避免暴露内部异常详情")
            .isEqualTo("中转服务短暂不可达，我们正在自动重试，请稍后再试");
    }
}
