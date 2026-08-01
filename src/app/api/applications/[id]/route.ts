import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireRecruitmentOrgStaff } from "@/lib/orgs/permissions";
import { sendApplicationResultEmail } from "@/lib/notifications/sender";
import type { ApplicationStatus } from "@/lib/orgs/types";

const VALID: ApplicationStatus[] = [
  "submitted",
  "screening",
  "audition",
  "passed",
  "rejected",
];

// PATCH /api/applications/:id — 지원자 상태 변경. staff.
//   passed/rejected 로 전환 시 지원자에게 결과 이메일(이메일 있을 때만).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svc = createServiceClient();

  const { data: app } = await svc
    .from("applications")
    .select("id, recruitment_id, status, email, name")
    .eq("id", id)
    .maybeSingle();
  if (!app) {
    return NextResponse.json({ error: "지원서를 찾을 수 없습니다." }, { status: 404 });
  }

  const guard = await requireRecruitmentOrgStaff(app.recruitment_id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: { status?: string; admin_note?: string; notify?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
  const status = body.status as ApplicationStatus;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
  }

  const isDecision = status === "passed" || status === "rejected";
  const { error } = await svc
    .from("applications")
    .update({
      status,
      admin_note: body.admin_note?.trim() || null,
      reviewed_at: isDecision ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "변경에 실패했습니다." }, { status: 500 });
  }

  // 결과 통보 (합격/불합격 + 이메일 보유 + notify !== false)
  let emailed = false;
  if (isDecision && app.email && body.notify !== false) {
    const { data: rec } = await svc
      .from("recruitments")
      .select("title, org:organizations(name)")
      .eq("id", app.recruitment_id)
      .maybeSingle();
    const orgName =
      (rec?.org as { name?: string } | { name?: string }[] | null) &&
      (Array.isArray(rec?.org) ? rec?.org[0]?.name : (rec?.org as { name?: string })?.name);
    emailed = await sendApplicationResultEmail({
      to: app.email,
      orgName: orgName ?? "",
      recruitmentTitle: rec?.title ?? "",
      passed: status === "passed",
      note: body.admin_note?.trim() || null,
    });
  }

  return NextResponse.json({ ok: true, emailed });
}
