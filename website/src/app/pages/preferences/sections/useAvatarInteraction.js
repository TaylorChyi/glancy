/**
 * 背景：
 *  - 头像文件选择逻辑之前直接内联在 AccountSection 中，造成副作用与渲染逻辑耦合。
 * 目的：
 *  - 将 avatar 触发与变更逻辑抽象为 hook，便于测试与后续扩展上传策略。
 * 关键决策与取舍：
 *  - 使用 useRef 保存 input 引用，避免重复查询 DOM；
 *  - 返回 click handler 以支持按钮触发；
 *  - 清空 input value 以便多次选择相同文件。
 * 影响范围：
 *  - AccountSection 的头像交互流程。
 * 演进与TODO：
 *  - 后续可在此接入上传进度监听与错误提示。
 */
import { useCallback, useId, useRef } from "react";

/**
 * 意图：管理头像上传 input 的引用、标识与交互回调。
 * 输入：identity —— 包含 onSelectAvatar 的对象，可为空。
 * 输出：avatarInputId、avatarInputRef、onAvatarTrigger、onAvatarChange。
 * 流程：
 *  1) 生成稳定的 input id；
 *  2) 提供触发按钮点击的回调；
 *  3) 处理文件变更并回调外部逻辑，同时重置 input 值。
 * 错误处理：异常交由外部处理。
 * 复杂度：O(1)。
 */
export function useAvatarInteraction(identity) {
  const avatarInputId = useId();
  const avatarInputRef = useRef(null);

  const handleAvatarTrigger = useCallback(() => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  }, []);

  const handleAvatarChange = useCallback(
    (event) => {
      identity?.onSelectAvatar?.(event.target.files ?? null);
      if (event?.target) {
        event.target.value = "";
      }
    },
    [identity],
  );

  return {
    avatarInputId,
    avatarInputRef,
    onAvatarTrigger: handleAvatarTrigger,
    onAvatarChange: handleAvatarChange,
  };
}
