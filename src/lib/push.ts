export async function registerServiceWorkerAndSubscribe(vapidPublicKey?: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    // Subscribe to push
    const pushServerUrl = import.meta.env.VITE_PUSH_SERVER_URL as string | undefined;
    let vapid = vapidPublicKey;
    if (!vapid && pushServerUrl) {
      try {
        const resp = await fetch(`${pushServerUrl.replace(/\/$/, '')}/keys`);
        const json = await resp.json();
        vapid = json.publicKey;
      } catch (e) {
        // ignore
      }
    }
    if (!vapid) return reg;
    const convertedVapidKey = urlBase64ToUint8Array(vapid);
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: convertedVapidKey });

    // Optionally send subscription to server if push server is configured
    if (pushServerUrl) {
      try {
        await fetch(`${pushServerUrl.replace(/\/$/, '')}/subscribe`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub)
        });
      } catch (e) {
        console.warn('Failed to POST subscription to push server', e);
      }
    }

    return { registration: reg, subscription: sub };
  } catch (e) {
    console.error('Push registration failed', e);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
