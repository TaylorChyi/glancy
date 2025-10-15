/**
 * 背景：
 *  - Service Worker 注册逻辑先前直接依赖全局对象且路径常量硬编码，导致测试困难且缺乏语义化命名。
 * 目的：
 *  - 通过可注入依赖的工厂函数创建注册队列，便于测试与未来扩展多 Service Worker 策略。
 * 关键决策与取舍：
 *  - 默认仍在 `load` 事件后注册，保持与现有性能假设一致；如需懒加载可进一步在调用层封装策略。
 * 影响范围：
 *  - 依赖 Service Worker 注册的页面加载流程；默认导出保持原签名以兼容既有调用。
 * 演进与TODO：
 *  - 后续可引入特性开关以按需启用 Service Worker，或扩展错误上报机制。
 */

const DEFAULT_SERVICE_WORKER_PATH = "/service-worker.js";

export function createQueueServiceWorkerRegistration({
  windowRef,
  navigatorRef,
  serviceWorkerPath = DEFAULT_SERVICE_WORKER_PATH,
} = {}) {
  const resolvedWindow = windowRef ?? (typeof window !== "undefined" ? window : undefined);
  const resolvedNavigator =
    navigatorRef ?? (typeof navigator !== "undefined" ? navigator : undefined);

  let isRegistrationQueued = false;

  return function queueServiceWorkerRegistration(path = serviceWorkerPath) {
    if (isRegistrationQueued || !resolvedWindow || !resolvedNavigator) {
      return;
    }

    if (!("serviceWorker" in resolvedNavigator)) {
      return;
    }

    isRegistrationQueued = true;

    resolvedWindow.addEventListener("load", async () => {
      try {
        await resolvedNavigator.serviceWorker.register(path);
      } catch (error) {
        if (import.meta.env?.DEV) {
          console.error("Service worker registration failed", error);
        }
      }
    });
  };
}

const queueServiceWorkerRegistration = createQueueServiceWorkerRegistration();

export default queueServiceWorkerRegistration;
