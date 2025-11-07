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
