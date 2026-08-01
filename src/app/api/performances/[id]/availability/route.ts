import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser, getOrgRole } from "@/lib/orgs/permissions";

// GET /api/performances/:id/availability — 회차별 잔여석 (공개).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svc = createServiceClient();

  const { data: perf } = await svc
    .from("performances")
    .select("id, org_id, origin, visibility")
    .eq("id", id)
    .maybeSingle();

  if (!perf || perf.origin !== "org") {
    return NextResponse.json({ error: "예약 가능한 공연이 아닙니다." }, { status: 404 });
  }

  // 비공개는 소속 멤버만
  if (perf.visibility === "private") {
    const user = await getSessionUser();
    const role = user && perf.org_id ? await getOrgRole(perf.org_id, user.id) : null;
    if (!role) {
      return NextResponse.json({ error: "예약 가능한 공연이 아닙니다." }, { status: 404 });
    }
  }

  const [{ data: shows }, { data: availability }] = await Promise.all([
    svc
      .from("performance_shows")
      .select("id, starts_at, capacity, label")
      .eq("performance_id", id)
      .order("starts_at", { ascending: true }),
    svc
      .from("show_availability")
      .select("show_id, remaining")
      .eq("performance_id", id),
  ]);

  const remainingMap = new Map(
    (availability ?? []).map((a) => [a.show_id, a.remaining])
  );

  const result = (shows ?? []).map((s) => ({
    id: s.id,
    starts_at: s.starts_at,
    capacity: s.capacity,
    label: s.label,
    remaining: remainingMap.get(s.id) ?? null, // null = 무제한
  }));

  return NextResponse.json({ shows: result });
}
