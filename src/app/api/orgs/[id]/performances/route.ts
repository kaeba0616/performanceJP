import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";

// POST /api/orgs/:id/performances — org 공연 개설(초안). staff 이상.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;
  const guard = await requireOrgStaff(orgId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: {
    title?: string;
    start_date?: string;
    end_date?: string;
    venue?: string;
    city?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const start_date = (body.start_date ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "공연 제목을 입력해주세요.", field: "title" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return NextResponse.json({ error: "공연 날짜를 입력해주세요.", field: "start_date" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: perf, error } = await svc
    .from("performances")
    .insert({
      org_id: orgId,
      origin: "org",
      visibility: "private", // 초안으로 생성 → 발행 시 public
      type: "festival", // org 공연은 대표 아티스트가 없음
      title,
      start_date,
      end_date: body.end_date?.trim() || null,
      venue: body.venue?.trim() || null,
      city: body.city?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !perf) {
    console.error("Failed to create org performance", error);
    return NextResponse.json({ error: "공연 개설에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: perf.id });
}
