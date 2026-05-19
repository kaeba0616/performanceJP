import webpush, { type PushSubscription, type SendResult } from "web-push";
import { createServiceClient } from "@/lib/supabase/server";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Web Push 미설정: NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT 필요",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

export interface PushTarget {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface SendOutcome {
  id: string;
  ok: boolean;
  statusCode?: number;
  removed?: boolean;
  error?: string;
}

/**
 * Send a single push. On 404/410 the subscription is dead — we delete it.
 */
export async function sendPushTo(
  target: PushTarget,
  payload: PushPayload,
): Promise<SendOutcome> {
  ensureConfigured();

  const subscription: PushSubscription = {
    endpoint: target.endpoint,
    keys: { p256dh: target.p256dh, auth: target.auth },
  };

  try {
    const result: SendResult = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    return { id: target.id, ok: true, statusCode: result.statusCode };
  } catch (err) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    const statusCode = e.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await deleteSubscription(target.id);
      return { id: target.id, ok: false, statusCode, removed: true };
    }
    return {
      id: target.id,
      ok: false,
      statusCode,
      error: e.message || e.body || "unknown",
    };
  }
}

export async function sendPushToMany(
  targets: PushTarget[],
  payload: PushPayload,
): Promise<SendOutcome[]> {
  return Promise.all(targets.map((t) => sendPushTo(t, payload)));
}

async function deleteSubscription(id: string) {
  const supabase = createServiceClient();
  await supabase.from("web_push_subscriptions").delete().eq("id", id);
}

export async function loadAllSubscriptions(): Promise<PushTarget[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("web_push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (error) throw error;
  return (data || []) as PushTarget[];
}

export async function loadSubscriptionsForSubscriber(
  subscriberId: string,
): Promise<PushTarget[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("web_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("subscriber_id", subscriberId);
  if (error) throw error;
  return (data || []) as PushTarget[];
}
