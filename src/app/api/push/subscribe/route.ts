import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface SubscribeBody {
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  email?: string;
}

export async function POST(request: NextRequest) {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json(
      { error: "subscription.endpoint / keys.p256dh / keys.auth가 필요합니다." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  let subscriberId: string | null = null;
  if (body.email) {
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id")
      .eq("email", body.email)
      .maybeSingle();
    subscriberId = existing?.id ?? null;
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  const { error } = await supabase
    .from("web_push_subscriptions")
    .upsert(
      {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        subscriber_id: subscriberId,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    console.error("[push/subscribe] insert failed", error);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
