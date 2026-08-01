import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";
import { kstNaiveToISO } from "@/lib/utils/date";

// POST /api/orgs/:id/rehearsals — 연습 일정 등록. staff.
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
    starts_at?: string;
    ends_at?: string;
    location?: string;
    target_parts?: string;
    performance_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const startsAt = (body.starts_at ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "제목을 입력해주세요.", field: "title" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startsAt)) {
    return NextResponse.json({ error: "연습 일시를 입력해주세요.", field: "starts_at" }, { status: 400 });
  }

  const svc = createServiceClient();

  // performance_id 지정 시 org 소유 확인
  let performanceId: string | null = null;
  if (body.performance_id) {
    const { data: perf } = await svc
      .from("performances")
      .select("id")
      .eq("id", body.performance_id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (perf) performanceId = perf.id;
  }

  const { data: reh, error } = await svc
    .from("rehearsals")
    .insert({
      org_id: orgId,
      performance_id: performanceId,
      title,
      starts_at: kstNaiveToISO(startsAt),
      ends_at: body.ends_at?.trim() ? kstNaiveToISO(body.ends_at.trim()) : null,
      location: body.location?.trim() || null,
      target_parts: body.target_parts?.trim() || null,
      created_by: guard.ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !reh) {
    console.error("Failed to create rehearsal", error);
    return NextResponse.json({ error: "연습 일정 등록에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: reh.id });
}
