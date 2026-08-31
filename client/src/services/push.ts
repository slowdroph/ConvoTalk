import api from "./api";
import type { PushPublicKeyResponse, PushSubscriptionPayload } from "../../../shared/types";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function currentKeyAsBytesEqual(a: ArrayBuffer, b: Uint8Array): boolean {
    if (a.byteLength !== b.length) return false;
    const aBytes = new Uint8Array(a);
    for (let i = 0; i < aBytes.length; i++) {
        if (aBytes[i] !== b[i]) return false;
    }
    return true;
}

export function isPushSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

export async function getVapidPublicKey(): Promise<string | null> {
    try {
        const res = await api.get<PushPublicKeyResponse>("/push/vapid-public-key");
        return res.data?.publicKey || null;
    } catch {
        return null;
    }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
    if (!isPushSupported()) return null;
    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    } catch {
        return null;
    }
}

export async function subscribeToPush(): Promise<boolean> {
    if (!isPushSupported()) {
        return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        return false;
    }

    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Detecta rotação de chave VAPID no servidor e reassina se necessário
            let matchesKey = true;
            const currentKey = subscription.options.applicationServerKey;
            const newKey = urlBase64ToUint8Array(publicKey);
            if (currentKey && currentKey.byteLength !== newKey.byteLength) {
                matchesKey = false;
            } else if (
                currentKey &&
                !currentKeyAsBytesEqual(currentKey, newKey)
            ) {
                matchesKey = false;
            }
            if (!matchesKey) {
                await subscription.unsubscribe();
                subscription = null;
            }
        }

        if (!subscription) {
            const convertedKey = urlBase64ToUint8Array(publicKey);
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey as unknown as BufferSource,
            });
        }

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
            return false;
        }

        const payload: PushSubscriptionPayload = {
            endpoint: json.endpoint,
            keys: {
                p256dh: json.keys.p256dh,
                auth: json.keys.auth,
            },
            userAgent: navigator.userAgent,
        };

        await api.post("/push/subscribe", payload);
        return true;
    } catch (error) {
        console.error("Erro ao registrar push subscription:", error);
        return false;
    }
}

export async function unsubscribeFromPush(): Promise<boolean> {
    if (!isPushSupported()) return true;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            try {
                await api.post("/push/unsubscribe", {
                    endpoint: subscription.endpoint,
                });
            } catch {
                return false;
            }
            await subscription.unsubscribe();
        }
        return true;
    } catch (error) {
        console.error("Erro ao desinscrever de push:", error);
        return false;
    }
}
