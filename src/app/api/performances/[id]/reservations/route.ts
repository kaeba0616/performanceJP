import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { clientIp } from "@/lib/utils/ip";
import { sendReservationConfirmation } from "@/lib/notifications/sender";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_PARTY_SIZE = 20;

// POST /api/performances/:id/reservations — 무인증 예약. (A6)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: perfId } = await params;

  let body: {
    name?: string;
    phone?: string;
    email?: string;
    party_size?: number;
    note?: string;
    show_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const partySize = Number(body.party_size ?? 1);
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요.", field: "name" }, { status: 400 });
  }
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > MAX_PARTY_SIZE) {
    return NextResponse.json({ error: `인원은 1~${MAX_PARTY_SIZE}명으로 입력해주세요.`, field: "party_size" }, { status: 400 });
  }

  const svc = createServiceClient();

  // 공연 검증: org 공연 + 공개(private면 예약 불가)
  const { data: perf } = await svc
    .from("performances")
    .select("id, org_id, origin, visibility, title")
    .eq("id", perfId)
    .maybeSingle();
  if (!perf || perf.origin !== "org" || !perf.org_id || perf.visibility === "private") {
    return NextResponse.json({ error: "예약할 수 없는 공연입니다." }, { status: 404 });
  }

  // 회차 검증 (있으면 해당 공연 소속이어야 함)
  const showId = body.show_id?.trim() || null;
  if (showId) {
    const { data: show } = await svc
      .from("performance_shows")
      .select("id, label, starts_at")
      .eq("id", showId)
      .eq("performance_id", perfId)
      .maybeSingle();
    if (!show) {
      return NextResponse.json({ error: "선택한 회차를 찾을 수 없습니다." }, { status: 400 });
    }
  }

  const ip = clientIp(request);

  // IP rate-limit
  if (ip) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await svc
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("submitter_ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
    }
  }

  // 사전 정원 확인 (회차에 정원이 있는 경우)
  if (showId) {
    const over = await isOverCapacity(svc, showId, partySize);
    if (over) {
      return NextResponse.json({ error: "잔여석이 부족합니다." }, { status: 409 });
    }
  }

  const { data: inserted, error: insertError } = await svc
    .from("reservations")
    .insert({
      performance_id: perfId,
      show_id: showId,
      name,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      party_size: partySize,
      note: body.note?.trim() || null,
      status: "confirmed",
      submitter_ip: ip,
    })
    .select("id, cancel_token")
    .single();

  if (insertError || !inserted) {
    console.error("Failed to create reservation", insertError);
    return NextResponse.json({ error: "예약에 실패했습니다." }, { status: 500 });
  }

  // 낙관적 초과예약 방지: 삽입 후 재확인, 초과 시 롤백
  if (showId && (await isOverCapacity(svc, showId, 0))) {
    await svc.from("reservations").delete().eq("id", inserted.id);
    return NextResponse.json({ error: "잔여석이 부족합니다." }, { status: 409 });
  }

  // 확인 메일 (이메일 있을 때만, 실패해도 예약은 성공)
  if (inserted && body.email?.trim()) {
    const { data: org } = await svc
      .from("organizations")
      .select("name")
      .eq("id", perf.org_id)
      .maybeSingle();
    const { data: show } = showId
      ? await svc.from("performance_shows").select("label, starts_at").eq("id", showId).maybeSingle()
      : { data: null };
    await sendReservationConfirmation({
      to: body.email.trim(),
      orgName: org?.name ?? "",
      performanceTitle: perf.title,
      performanceId: perfId,
      showLabel: show?.label ?? (show?.starts_at ?? null),
      partySize,
      cancelToken: inserted.cancel_token,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, cancelToken: inserted.cancel_token });
}

// show_availability 뷰로 (기존 예약 + 추가 인원)이 정원을 넘는지 확인.
async function isOverCapacity(
  svc: ReturnType<typeof createServiceClient>,
  showId: string,
  additional: number
): Promise<boolean> {
  const { data } = await svc
    .from("show_availability")
    .select("capacity, reserved")
    .eq("show_id", showId)
    .maybeSingle();
  if (!data || data.capacity == null) return false; // 무제한
  return (data.reserved ?? 0) + additional > data.capacity;
}
