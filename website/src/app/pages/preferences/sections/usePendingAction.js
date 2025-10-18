/**
 * 背景：
 *  - 数据分区存在多个异步命令，原实现需要在每个 handler 中重复维护 pending 字段。
 * 目的：
 *  - 提供统一的 pending 状态管理 Hook，通过包装异步函数减少重复代码。
 * 关键决策与取舍：
 *  - runWithPending 采用 Promise 接口，便于与 async/await 协同；
 *  - 暂未内置错误提示，保留在调用方实现，以便根据业务策略定制反馈。
 * 影响范围：
 *  - 偏好设置数据分区的异步命令；
 *  - 其他页面若需要轻量 pending 管理，可直接复用。
 * 演进与TODO：
 *  - TODO: 后续可支持超时自动恢复或全局 Toast 注入。
 */

import { useCallback, useState } from "react";

export const usePendingAction = () => {
  const [pendingAction, setPendingAction] = useState("");

  const runWithPending = useCallback(async (actionId, task) => {
    setPendingAction(actionId);
    try {
      await task();
    } finally {
      setPendingAction("");
    }
  }, []);

  const isActionPending = useCallback(
    (actionId) => pendingAction === actionId,
    [pendingAction],
  );

  return { runWithPending, isActionPending };
};
