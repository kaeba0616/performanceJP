import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { clientIp } from "@/lib/utils/ip";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

// POST /api/recruitments/:id/applications — 무인증 지원서 제출.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recruitmentId } = await params;

  let body: {
    name?: string;
    phone?: string;
    email?: string;
    part?: string;
    intro?: string;
    attachment_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요.", field: "name" }, { status: 400 });
  }

  const svc = createServiceClient();

  // 모집 공고 확인: 존재 + 모집중
  const { data: rec } = await svc
    .from("recruitments")
    .select("id, status")
    .eq("id", recruitmentId)
    .maybeSingle();
  if (!rec) {
    return NextResponse.json({ error: "모집 공고를 찾을 수 없습니다." }, { status: 404 });
  }
  if (rec.status !== "open") {
    return NextResponse.json({ error: "이미 마감된 모집입니다." }, { status: 409 });
  }

  const ip = clientIp(request);
  if (ip) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await svc
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("submitter_ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
    }
  }

  const { error } = await svc.from("applications").insert({
    recruitment_id: recruitmentId,
    name,
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    part: body.part?.trim() || null,
    intro: body.intro?.trim() || null,
    attachment_url: body.attachment_url?.trim() || null,
    submitter_ip: ip,
  });

  if (error) {
    console.error("Failed to submit application", error);
    return NextResponse.json({ error: "지원서 제출에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
