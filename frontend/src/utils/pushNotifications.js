import { API_BASE } from "../config/api";

const API = API_BASE;

/** Convert a base64 URL string to Uint8Array (required by Push API) */
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Register the service worker (sw.js in /public) */
export async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("[Push] Service Worker registered:", reg.scope);
        return reg;
    } catch (err) {
        console.warn("[Push] Service Worker registration failed:", err.message);
        return null;
    }
}

/** Subscribe user to push and post the subscription to the backend */
export async function subscribeToPush(token) {
    try {
        if (!("PushManager" in window)) {
            console.warn("[Push] Push API not supported in this browser");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("[Push] Notification permission denied");
            return;
        }

        // Fetch VAPID public key
        const keyRes = await fetch(`${API}/push/vapid-public-key`);
        const { publicKey } = await keyRes.json();
        if (!publicKey) {
            console.warn("[Push] No VAPID public key returned — push disabled");
            return;
        }

        const swReg = await navigator.serviceWorker.ready;
        const subscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // Save to backend
        await fetch(`${API}/push/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ subscription }),
        });

        console.log("[Push] Subscribed and saved to server");
    } catch (err) {
        console.warn("[Push] Subscribe error:", err.message);
    }
}
