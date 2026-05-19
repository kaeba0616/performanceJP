import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin/auth";
import {
  loadAllSubscriptions,
  sendPushToMany,
  type PushPayload,
} from "@/lib/notifications/push";

interface TestBody {
  title?: string;
  body?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let input: TestBody = {};
  try {
    input = (await request.json()) as TestBody;
  } catch {
    // empty body — use defaults
  }

  const payload: PushPayload = {
    title: input.title || "THE PULSE 테스트 알림",
    body: input.body || "푸시 알림이 정상 작동합니다 🎶",
    url: input.url || "/",
    tag: "test",
  };

  const targets = await loadAllSubscriptions();
  const results = await sendPushToMany(targets, payload);

  const summary = {
    total: results.length,
    success: results.filter((r) => r.ok).length,
    removed: results.filter((r) => r.removed).length,
    failed: results.filter((r) => !r.ok && !r.removed).length,
    results,
  };

  return NextResponse.json(summary);
}
