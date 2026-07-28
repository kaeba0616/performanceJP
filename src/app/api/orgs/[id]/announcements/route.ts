import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";
import type { AnnouncementAudience } from "@/lib/orgs/types";

const VALID_AUDIENCE: AnnouncementAudience[] = ["members", "reservers", "public"];

// POST /api/orgs/:id/announcements — 공지 작성(초안). staff 이상.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;
  const guard = await requireOrgStaff(orgId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: {
    title?: string;
    body?: string;
    audience?: string;
    performance_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const text = (body.body ?? "").trim();
  const audience = body.audience as AnnouncementAudience;

  if (!title) {
    return NextResponse.json({ error: "제목을 입력해주세요.", field: "title" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "내용을 입력해주세요.", field: "body" }, { status: 400 });
  }
  if (!VALID_AUDIENCE.includes(audience)) {
    return NextResponse.json({ error: "대상을 선택해주세요.", field: "audience" }, { status: 400 });
  }

  const svc = createServiceClient();

  // performance_id 가 지정되면 해당 org 소유인지 확인
  let performanceId: string | null = null;
  if (body.performance_id) {
    const { data: perf } = await svc
      .from("performances")
      .select("id")
      .eq("id", body.performance_id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!perf) {
      return NextResponse.json({ error: "잘못된 공연입니다." }, { status: 400 });
    }
    performanceId = perf.id;
  }

  const { data: ann, error } = await svc
    .from("announcements")
    .insert({
      org_id: orgId,
      performance_id: performanceId,
      title,
      body: text,
      audience,
      created_by: guard.ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !ann) {
    console.error("Failed to create announcement", error);
    return NextResponse.json({ error: "공지 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: ann.id });
}
