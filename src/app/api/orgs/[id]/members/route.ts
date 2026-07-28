import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";

// GET /api/orgs/:id/members — 멤버 목록 (staff 이상)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;
  const guard = await requireOrgStaff(orgId);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("org_members")
    .select(
      "user_id, role, joined_at, profile:profiles(handle, display_name, avatar_url)"
    )
    .eq("org_id", orgId)
    .order("joined_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}
