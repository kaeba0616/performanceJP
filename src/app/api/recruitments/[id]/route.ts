import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireRecruitmentOrgStaff } from "@/lib/orgs/permissions";
import type { Database } from "@/lib/supabase/types";

type RecruitmentUpdate = Database["public"]["Tables"]["recruitments"]["Update"];

// PATCH /api/recruitments/:id — 수정·마감. staff.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireRecruitmentOrgStaff(id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const patch: RecruitmentUpdate = {};
  if ("title" in body) {
    const t = String(body.title ?? "").trim();
    if (!t) return NextResponse.json({ error: "제목은 비울 수 없습니다." }, { status: 400 });
    patch.title = t;
  }
  for (const f of ["description", "parts"] as const) {
    if (f in body) patch[f] = String(body[f] ?? "").trim() || null;
  }
  if ("deadline" in body) {
    const v = String(body.deadline ?? "").trim();
    patch.deadline = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  }
  if ("is_public" in body) patch.is_public = body.is_public !== false;
  if ("status" in body) {
    const s = String(body.status ?? "");
    if (s !== "open" && s !== "closed") {
      return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
    }
    patch.status = s;
  }
  if ("headcount" in body) {
    const v = body.headcount;
    patch.headcount = v == null || v === "" ? null : Number(v);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc.from("recruitments").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/recruitments/:id — 삭제. staff.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireRecruitmentOrgStaff(id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const svc = createServiceClient();
  const { error } = await svc.from("recruitments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
