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
