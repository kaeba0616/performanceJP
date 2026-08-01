import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";
import type { OrgRole } from "@/lib/orgs/types";

const VALID_ROLES: OrgRole[] = ["staff", "member"];

// POST /api/orgs/:id/invites — 초대 코드 발급.
//   member 초대는 staff 이상, staff 초대는 owner만.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;

  const guard = await requireOrgStaff(orgId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: { role?: string; expires_at?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const role = (body.role as OrgRole) ?? "member";
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "잘못된 역할입니다." }, { status: 400 });
  }
  // staff 역할 초대는 owner만 가능
  if (role === "staff" && guard.ctx.role !== "owner") {
    return NextResponse.json(
      { error: "운영진 초대는 소유자만 발급할 수 있습니다." },
      { status: 403 }
    );
  }

  const svc = createServiceClient();
  const { data: invite, error } = await svc
    .from("org_invites")
    .insert({
      org_id: orgId,
      role,
      expires_at: body.expires_at ?? null,
      created_by: guard.ctx.user.id,
    })
    .select("code, role, expires_at")
    .single();

  if (error || !invite) {
    console.error("Failed to create invite", error);
    return NextResponse.json({ error: "초대 발급에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code: invite.code, role: invite.role });
}
