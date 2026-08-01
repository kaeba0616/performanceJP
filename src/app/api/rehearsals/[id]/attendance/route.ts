import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser, getOrgRole } from "@/lib/orgs/permissions";
import type { AttendanceStatus } from "@/lib/orgs/types";

const VALID: AttendanceStatus[] = ["going", "not", "maybe"];

// PUT /api/rehearsals/:id/attendance — 단원이 본인 참석 상태 설정(세션 기반, Q3=a).
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rehearsalId } = await params;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
  const status = body.status as AttendanceStatus;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: reh } = await svc
    .from("rehearsals")
    .select("id, org_id")
    .eq("id", rehearsalId)
    .maybeSingle();
  if (!reh) {
    return NextResponse.json({ error: "연습 일정을 찾을 수 없습니다." }, { status: 404 });
  }

  // 본인이 해당 org 멤버여야 함
  const role = await getOrgRole(reh.org_id, user.id);
  if (!role) {
    return NextResponse.json({ error: "단체 소속이 아닙니다." }, { status: 403 });
  }

  const { error } = await svc
    .from("rehearsal_attendances")
    .upsert(
      {
        rehearsal_id: rehearsalId,
        user_id: user.id,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "rehearsal_id,user_id" }
    );

  if (error) {
    console.error("Failed to set attendance", error);
    return NextResponse.json({ error: "참석 체크에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
