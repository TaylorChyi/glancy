const DEFAULT_SERVICE_WORKER_PATH = "/service-worker.js";

export function createQueueServiceWorkerRegistration({
  windowRef,
  navigatorRef,
  serviceWorkerPath = DEFAULT_SERVICE_WORKER_PATH,
} = {}) {
  const resolvedWindow =
    windowRef ?? (typeof window !== "undefined" ? window : undefined);
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
