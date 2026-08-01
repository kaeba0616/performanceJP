import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";

// POST /api/orgs/:id/recruitments — 모집 공고 생성. staff 이상.
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
    description?: string;
    parts?: string;
    headcount?: number | null;
    deadline?: string;
    is_public?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "제목을 입력해주세요.", field: "title" }, { status: 400 });
  }

  let headcount: number | null = null;
  if (body.headcount != null && body.headcount !== ("" as unknown)) {
    const n = Number(body.headcount);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: "모집 인원은 0 이상의 정수여야 합니다." }, { status: 400 });
    }
    headcount = n;
  }

  const svc = createServiceClient();
  const { data: rec, error } = await svc
    .from("recruitments")
    .insert({
      org_id: orgId,
      title,
      description: body.description?.trim() || null,
      parts: body.parts?.trim() || null,
      headcount,
      deadline: body.deadline?.trim() || null,
      is_public: body.is_public !== false,
      created_by: guard.ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !rec) {
    console.error("Failed to create recruitment", error);
    return NextResponse.json({ error: "모집 공고 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: rec.id });
}
