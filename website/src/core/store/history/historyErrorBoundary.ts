/**
 * 背景：
 *  - 历史状态机中的错误处理逻辑与业务流程紧耦合，
 *    导致每次扩展分页或清理策略都需要复制粘贴授权失效等分支。
 * 目的：
 *  - 以责任链思想抽离错误兜底器，让分页、增删等用例只关注成功路径，
 *    遇到异常时委托统一边界处理并注入副作用（例如登出用户）。
 * 关键决策与取舍：
 *  - 采用轻量类封装而非全局单例，确保上下文（context、dependencies）
 *    在测试中可以通过依赖注入替换；
 *  - 目前仅覆盖 APIError/其他错误两类，后续若需细分可扩展方法。
 * 影响范围：
 *  - 所有通过 HistoryStoreMachine 触发的远程交互；
 *  - 用户登出与错误消息呈现策略。
 * 演进与TODO：
 *  - 可追加日志埋点或错误分级上报能力。
 */

import { ApiError } from "@shared/api/client.js";
import { INITIAL_HISTORY_SLICE } from "./contracts.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "./contracts.ts";

export class HistoryErrorBoundary {
  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
  ) {}

  /**
   * 意图：统一捕获远程调用异常，根据错误类型恢复 store 状态。
   * 输入：任意错误对象，可能来自 fetch、保存或删除历史。
   * 输出：无返回值，通过 setState 与副作用更新上下游。
   * 流程：
   *  1) 判定是否为 401 ApiError；
   *  2) 401 时清理用户并重置历史；
   *  3) 其他错误则记录日志并保留错误消息。
   * 错误处理：自身只处理并吞异常，避免二次抛出干扰调用方。
   * 复杂度：O(1)。
   */
  public capture(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      this.dependencies.user.clearUser();
      const message = error.message?.trim()
        ? error.message
        : "登录状态已失效，请重新登录";
      this.context.setState({
        ...INITIAL_HISTORY_SLICE,
        error: message,
      });
      return;
    }

    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    this.context.setState({ error: message, isLoading: false });
  }
}
