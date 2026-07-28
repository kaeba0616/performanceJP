import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/orgs/permissions";

// POST /api/orgs/join — 초대 코드로 단체 가입. body: { code }
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "초대 코드가 필요합니다." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: invite } = await svc
    .from("org_invites")
    .select("id, org_id, role, expires_at, used_at")
    .eq("code", code)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });
  }
  if (invite.used_at) {
    return NextResponse.json({ error: "이미 사용된 초대 코드입니다." }, { status: 410 });
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "만료된 초대 코드입니다." }, { status: 410 });
  }

  // 단체 정보 (가입 후 리다이렉트용)
  const { data: org } = await svc
    .from("organizations")
    .select("handle, name")
    .eq("id", invite.org_id)
    .maybeSingle();

  // 이미 소속이면 그대로 성공 처리(역할은 유지)
  const { data: existing } = await svc
    .from("org_members")
    .select("role")
    .eq("org_id", invite.org_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: memberError } = await svc.from("org_members").insert({
      org_id: invite.org_id,
      user_id: user.id,
      role: invite.role,
    });
    if (memberError) {
      console.error("Failed to join org", memberError);
      return NextResponse.json({ error: "가입에 실패했습니다." }, { status: 500 });
    }
  }

  // 초대 코드 사용 처리 (1회용)
  await svc
    .from("org_invites")
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq("id", invite.id);

  return NextResponse.json({
    ok: true,
    handle: org?.handle ?? null,
    name: org?.name ?? null,
    already: !!existing,
  });
}
