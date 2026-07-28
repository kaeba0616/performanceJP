import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";
import type { OrgRole } from "@/lib/orgs/types";

const VALID_ROLES: OrgRole[] = ["owner", "staff", "member"];

// 소유자만 역할 변경/제명 가능. 마지막 owner는 강등/제명 불가.
async function ensureNotLastOwner(
  orgId: string,
  targetUserId: string
): Promise<boolean> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner");
  const owners = (data ?? []).map((r) => r.user_id);
  // 대상이 유일한 owner면 false
  return !(owners.length === 1 && owners[0] === targetUserId);
}

// PATCH /api/orgs/:id/members/:userId — 역할 변경
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: orgId, userId } = await params;
  const guard = await requireOrgStaff(orgId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  if (guard.ctx.role !== "owner") {
    return NextResponse.json(
      { error: "역할 변경은 소유자만 가능합니다." },
      { status: 403 }
    );
  }

  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }
  const role = body.role as OrgRole;
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "잘못된 역할입니다." }, { status: 400 });
  }

  if (role !== "owner" && !(await ensureNotLastOwner(orgId, userId))) {
    return NextResponse.json(
      { error: "마지막 소유자의 역할은 변경할 수 없습니다." },
      { status: 409 }
    );
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("org_members")
    .update({ role })
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "변경에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/orgs/:id/members/:userId — 제명 (본인 탈퇴도 허용)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: orgId, userId } = await params;
  const guard = await requireOrgStaff(orgId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  // 타인 제명은 owner만. 본인 탈퇴는 staff도 가능.
  const isSelf = guard.ctx.user.id === userId;
  if (!isSelf && guard.ctx.role !== "owner") {
    return NextResponse.json({ error: "제명은 소유자만 가능합니다." }, { status: 403 });
  }

  if (!(await ensureNotLastOwner(orgId, userId))) {
    return NextResponse.json(
      { error: "마지막 소유자는 탈퇴/제명할 수 없습니다." },
      { status: 409 }
    );
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "제명에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
