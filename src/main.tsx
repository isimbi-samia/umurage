import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registerServiceWorkerAndSubscribe } from "@/lib/push";

// Listen for beforeinstallprompt and save for later UI
window.addEventListener("beforeinstallprompt", (e: any) => {
  e.preventDefault();
  (window as any).__deferredInstallPrompt = e;
});

// Register service worker in production
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration failed", err));
    }
  });

  // Optionally subscribe to push notifications if VAPID key is provided
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as
    | string
    | undefined;

  if (vapid) {
    registerServiceWorkerAndSubscribe(vapid)
      .then(() => {})
      .catch(() => {});
  }
}

// Expose helper in development
if (import.meta.env.DEV) {
  (window as any).__registerPush =
    registerServiceWorkerAndSubscribe;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);