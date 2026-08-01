import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireRehearsalOrgStaff } from "@/lib/orgs/permissions";

// DELETE /api/rehearsals/:id — 연습 일정 삭제. staff.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireRehearsalOrgStaff(id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const svc = createServiceClient();
  const { error } = await svc.from("rehearsals").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
