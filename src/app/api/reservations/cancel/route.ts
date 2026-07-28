import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/reservations/cancel — cancel_token 으로 예약 취소 (무인증).
// 확인 메일의 취소 링크(/reservations/cancel/:token)에서 호출.
export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
  const token = (body.token ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "취소 토큰이 필요합니다." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: reservation } = await svc
    .from("reservations")
    .select("id, status")
    .eq("cancel_token", token)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }
  if (reservation.status === "cancelled") {
    return NextResponse.json({ ok: true, already: true });
  }

  const { error } = await svc
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservation.id);
  if (error) {
    return NextResponse.json({ error: "취소에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
