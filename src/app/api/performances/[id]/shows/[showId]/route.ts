import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requirePerfOrgStaff } from "@/lib/orgs/permissions";

// DELETE /api/performances/:id/shows/:showId — 회차 삭제.
//   유효 예약(pending/confirmed)이 있으면 삭제 거부.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; showId: string }> }
) {
  const { id: perfId, showId } = await params;
  const guard = await requirePerfOrgStaff(perfId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const svc = createServiceClient();

  const { count } = await svc
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("show_id", showId)
    .in("status", ["pending", "confirmed"]);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "예약이 있는 회차는 삭제할 수 없습니다." },
      { status: 409 }
    );
  }

  const { error } = await svc
    .from("performance_shows")
    .delete()
    .eq("id", showId)
    .eq("performance_id", perfId);

  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
