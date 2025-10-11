/**
 * 背景：
 *  - 现有异常处理直接将后端异常消息透传给客户端，遇到 5xx 等服务器异常时会暴露内部细节。
 * 目的：
 *  - 通过状态码驱动的策略模式，统一约束对外暴露的错误文案，在服务端异常时返回稳定、可本地化的信息。
 * 关键决策与取舍：
 *  - 采用策略模式（Strategy）管理不同状态码段的消息转换，便于未来针对 4xx/5xx 乃至特定业务码扩展文案处理。
 *  - 放弃简单 if/else 实现，避免在全局异常处理器中堆叠条件分支，提升可维护性与测试友好度。
 * 影响范围：
 *  - 所有经由 GlobalExceptionHandler 输出的错误消息，将在响应前统一经过该解析器。
 * 演进与TODO：
 *  - 如需支持多语言或可配置文案，可在此处接入消息资源或特性开关以动态调整策略列表。
 */
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
            List.of(new BadGatewayMessageStrategy(), new ServerErrorMessageStrategy(), new PassthroughMessageStrategy())
        );
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

    /**
     * 背景：
     *  - 502 错误通常代表上游依赖中断，直接返回泛化提示无法让终端用户理解具体处置方式。
     * 目的：
     *  - 通过专门策略对 502 文案进行再包装，明确提示正在恢复并给出下一步建议。
     * 关键决策与取舍：
     *  - 采用策略模式的可插拔特性，在不修改其他分支的前提下新增 BadGateway 文案处理，保持拓展性。
     * 影响范围：
     *  - 所有以 502 结束的响应都会展示统一的对外提示，避免回退到 Nginx 默认页。
     * 演进与TODO：
     *  - 若后续需要 A/B 测试不同提示语，可在此处引入配置或特性开关实现动态切换。
     */
    static final class BadGatewayMessageStrategy implements ErrorMessageStrategy {

        private static final String FRIENDLY_MESSAGE = "中转服务短暂不可达，我们正在自动重试，请稍后再试";

        @Override
        public boolean supports(HttpStatus status) {
            return status == HttpStatus.BAD_GATEWAY;
        }

        @Override
        public String toPublicMessage(String originalMessage) {
            return FRIENDLY_MESSAGE;
        }
    }
}
