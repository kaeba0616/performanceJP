import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requirePerfOrgStaff } from "@/lib/orgs/permissions";
import type { ReservationStatus } from "@/lib/orgs/types";

const VALID: ReservationStatus[] = ["pending", "confirmed", "cancelled", "no_show"];

// PATCH /api/reservations/:id — 예약 상태 변경. 소유 org의 staff만.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svc = createServiceClient();

  const { data: reservation } = await svc
    .from("reservations")
    .select("id, performance_id")
    .eq("id", id)
    .maybeSingle();
  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }

  const guard = await requirePerfOrgStaff(reservation.performance_id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
  const status = body.status as ReservationStatus;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "잘못된 상태입니다." }, { status: 400 });
  }

  const { error } = await svc
    .from("reservations")
    .update({ status })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "변경에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
