import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requirePerfOrgStaff } from "@/lib/orgs/permissions";
import { kstNaiveToISO } from "@/lib/utils/date";

// POST /api/performances/:id/shows — 회차 추가. body: { starts_at(KST naive), capacity?, label? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: perfId } = await params;
  const guard = await requirePerfOrgStaff(perfId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: { starts_at?: string; capacity?: number | null; label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const startsAt = (body.starts_at ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startsAt)) {
    return NextResponse.json({ error: "회차 일시를 입력해주세요." }, { status: 400 });
  }

  let capacity: number | null = null;
  if (body.capacity !== undefined && body.capacity !== null && body.capacity !== ("" as unknown)) {
    const n = Number(body.capacity);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: "정원은 0 이상의 정수여야 합니다." }, { status: 400 });
    }
    capacity = n;
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("performance_shows")
    .insert({
      performance_id: perfId,
      starts_at: kstNaiveToISO(startsAt),
      capacity,
      label: body.label?.trim() || null,
    })
    .select("id, starts_at, capacity, label")
    .single();

  if (error || !data) {
    console.error("Failed to add show", error);
    return NextResponse.json({ error: "회차 추가에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, show: data });
}
