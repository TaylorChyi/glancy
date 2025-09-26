const SERVICE_WORKER_PATH = "/sw.js";
let isRegistrationQueued = false;

function queueServiceWorkerRegistration(path = SERVICE_WORKER_PATH) {
  if (isRegistrationQueued || typeof window === "undefined") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  isRegistrationQueued = true;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register(path);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Service worker registration failed", error);
      }
    }
  });
}

export default queueServiceWorkerRegistration;
