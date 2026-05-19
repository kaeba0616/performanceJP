import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface UnsubscribeBody {
  endpoint: string;
}

export async function POST(request: NextRequest) {
  let body: UnsubscribeBody;
  try {
    body = (await request.json()) as UnsubscribeBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint가 필요합니다." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("web_push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);

  if (error) {
    console.error("[push/unsubscribe] delete failed", error);
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
