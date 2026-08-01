import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/orgs/permissions";
import { validateOrgHandle, orgHandleErrorMessage } from "@/lib/orgs/handle";

// POST /api/orgs — 단체 생성. 생성자를 owner로 등록. (A5: 승인제 아님, 즉시 생성)
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: {
    handle?: string;
    name?: string;
    description?: string;
    contact?: string;
    logo_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const handle = (body.handle ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();

  const handleErr = validateOrgHandle(handle);
  if (handleErr) {
    return NextResponse.json(
      { error: orgHandleErrorMessage(handleErr), field: "handle" },
      { status: 400 }
    );
  }
  if (name.length < 1 || name.length > 60) {
    return NextResponse.json(
      { error: "단체 이름을 1~60자로 입력해주세요.", field: "name" },
      { status: 400 }
    );
  }

  const svc = createServiceClient();

  // 핸들 중복 확인
  const { data: existing } = await svc
    .from("organizations")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "이미 사용 중인 주소예요.", field: "handle" },
      { status: 409 }
    );
  }

  const { data: org, error: insertError } = await svc
    .from("organizations")
    .insert({
      handle,
      name,
      description: body.description?.trim() || null,
      contact: body.contact?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
      created_by: user.id,
    })
    .select("id, handle")
    .single();

  if (insertError || !org) {
    console.error("Failed to create organization", insertError);
    return NextResponse.json({ error: "단체 생성에 실패했습니다." }, { status: 500 });
  }

  // 생성자를 owner로 등록
  const { error: memberError } = await svc.from("org_members").insert({
    org_id: org.id,
    user_id: user.id,
    role: "owner",
  });
  if (memberError) {
    // 멤버 등록 실패 시 방금 만든 org를 롤백 (고아 단체 방지)
    await svc.from("organizations").delete().eq("id", org.id);
    console.error("Failed to create owner membership", memberError);
    return NextResponse.json({ error: "단체 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: org.id, handle: org.handle });
}
