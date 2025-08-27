import { useEffect } from "react";

interface EscapeKeyOptions<T extends KeyboardEvent = KeyboardEvent> {
  /**
   * 键盘事件处理函数
   */
  handler: (event: T) => void;
  /**
   * 是否激活监听
   */
  active?: boolean;
}

/**
 * 监听 Escape 键并触发回调
 */
export default function useEscapeKey<T extends KeyboardEvent = KeyboardEvent>({
  handler,
  active = true,
}: EscapeKeyOptions<T>): void {
  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler(e as T);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handler, active]);
}
