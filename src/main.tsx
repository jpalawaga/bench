import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import "./index.css";

const SERVICE_WORKER_CHECK_INTERVAL_MS = 30 * 60 * 1000;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

let hasPendingServiceWorkerUpdate = false;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    hasPendingServiceWorkerUpdate = true;
  },
  onOfflineReady() {
    // App is ready for offline use
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    const syncServiceWorker = () => {
      if (document.visibilityState !== "visible") return;

      // iOS standalone PWAs can sit suspended for a long time. Check on
      // foreground, then activate any waiting worker instead of leaving it stuck.
      if (hasPendingServiceWorkerUpdate) {
        hasPendingServiceWorkerUpdate = false;
        void updateSW();
        return;
      }

      void registration.update();
    };

    document.addEventListener("visibilitychange", syncServiceWorker);
    window.addEventListener("focus", syncServiceWorker);
    window.setInterval(() => {
      if (!hasPendingServiceWorkerUpdate) {
        void registration.update();
      }
    }, SERVICE_WORKER_CHECK_INTERVAL_MS);

    syncServiceWorker();
  },
});
