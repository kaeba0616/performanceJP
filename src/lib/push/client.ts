"use client";

export type PushPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export function getPushSupportState(): PushPermissionState {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator)) return "unsupported";
  if (!("PushManager" in window)) return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PushPermissionState;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export async function subscribeToPush(opts: { email?: string }): Promise<{
  ok: boolean;
  error?: string;
}> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return { ok: false, error: "푸시 키가 설정되지 않았습니다." };

  if (Notification.permission === "denied") {
    return {
      ok: false,
      error: "브라우저에서 알림 권한이 차단되어 있습니다. 사이트 설정에서 허용해주세요.",
    };
  }

  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      return { ok: false, error: "알림 권한이 필요합니다." };
    }
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(publicKey),
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), email: opts.email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data?.error || "서버 등록에 실패했습니다." };
  }
  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean }> {
  const sub = await getCurrentSubscription();
  if (!sub) return { ok: true };

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
  return { ok: true };
}
