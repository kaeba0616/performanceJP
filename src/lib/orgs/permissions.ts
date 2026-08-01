// 단체 권한 확인 헬퍼 (서버 전용).
//
// 쓰기는 전부 service_role 서버 API가 수행하므로(SPEC §8), 권한 검사도 여기서
// 명시적으로 한다. 세션 유저를 확인하고 org_members 에서 역할을 조회한다.

import type { User } from "@supabase/supabase-js";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { isStaffRole, type OrgRole, type Organization } from "./types";

/** 현재 세션의 로그인 유저(없으면 null). */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** org 내에서 user의 역할(미소속이면 null). service_role로 조회. */
export async function getOrgRole(
  orgId: string,
  userId: string
): Promise<OrgRole | null> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

/** handle로 단체 조회(공개). */
export async function getOrgByHandle(
  handle: string
): Promise<Organization | null> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("organizations")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();
  return data ?? null;
}

export interface StaffContext {
  user: User;
  org: Organization;
  role: OrgRole;
}

export type StaffGuardResult =
  | { ok: true; ctx: StaffContext }
  | { ok: false; status: 401 | 403 | 404; error: string };

/**
 * 로그인 + 해당 org의 staff(owner/staff) 권한을 요구한다.
 * 라우트 핸들러/서버 액션에서 공통으로 사용.
 */
export async function requireOrgStaff(
  orgId: string
): Promise<StaffGuardResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, status: 401, error: "로그인이 필요합니다." };

  const svc = createServiceClient();
  const { data: org } = await svc
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return { ok: false, status: 404, error: "단체를 찾을 수 없습니다." };

  const role = await getOrgRole(orgId, user.id);
  if (!isStaffRole(role)) {
    return { ok: false, status: 403, error: "권한이 없습니다." };
  }
  return { ok: true, ctx: { user, org, role: role! } };
}

/**
 * 공연이 org 소유이고 요청자가 해당 org의 staff인지 확인.
 * 라우트에서 org 공연 수정 권한 체크에 사용.
 */
export async function requirePerfOrgStaff(
  perfId: string
): Promise<
  | { ok: true; ctx: StaffContext; perf: { id: string; org_id: string | null } }
  | { ok: false; status: 401 | 403 | 404; error: string }
> {
  const svc = createServiceClient();
  const { data: perf } = await svc
    .from("performances")
    .select("id, org_id, origin")
    .eq("id", perfId)
    .maybeSingle();

  if (!perf || perf.origin !== "org" || !perf.org_id) {
    return { ok: false, status: 404, error: "공연을 찾을 수 없습니다." };
  }

  const guard = await requireOrgStaff(perf.org_id);
  if (!guard.ok) return guard;

  return {
    ok: true,
    ctx: guard.ctx,
    perf: { id: perf.id, org_id: perf.org_id },
  };
}

/** 모집 공고가 org 소유이고 요청자가 staff인지 확인. */
export async function requireRecruitmentOrgStaff(
  recruitmentId: string
): Promise<
  | { ok: true; ctx: StaffContext; orgId: string }
  | { ok: false; status: 401 | 403 | 404; error: string }
> {
  const svc = createServiceClient();
  const { data: rec } = await svc
    .from("recruitments")
    .select("id, org_id")
    .eq("id", recruitmentId)
    .maybeSingle();
  if (!rec) return { ok: false, status: 404, error: "모집 공고를 찾을 수 없습니다." };
  const guard = await requireOrgStaff(rec.org_id);
  if (!guard.ok) return guard;
  return { ok: true, ctx: guard.ctx, orgId: rec.org_id };
}

/** 연습이 org 소유이고 요청자가 staff인지 확인. */
export async function requireRehearsalOrgStaff(
  rehearsalId: string
): Promise<
  | { ok: true; ctx: StaffContext; orgId: string }
  | { ok: false; status: 401 | 403 | 404; error: string }
> {
  const svc = createServiceClient();
  const { data: reh } = await svc
    .from("rehearsals")
    .select("id, org_id")
    .eq("id", rehearsalId)
    .maybeSingle();
  if (!reh) return { ok: false, status: 404, error: "연습 일정을 찾을 수 없습니다." };
  const guard = await requireOrgStaff(reh.org_id);
  if (!guard.ok) return guard;
  return { ok: true, ctx: guard.ctx, orgId: reh.org_id };
}

/**
 * 로그인 + 해당 org의 멤버(누구나) 권한을 요구. 단원 전용 화면/액션용.
 */
export async function requireOrgMember(
  orgId: string
): Promise<
  | { ok: true; user: User; role: OrgRole }
  | { ok: false; status: 401 | 403; error: string }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, status: 401, error: "로그인이 필요합니다." };
  const role = await getOrgRole(orgId, user.id);
  if (!role) return { ok: false, status: 403, error: "단체 소속이 아닙니다." };
  return { ok: true, user, role };
}

/**
 * handle 기준 멤버 가드(서버 컴포넌트용). 미소속이면 redirect 경로 반환.
 */
export async function loadMemberContextByHandle(
  handle: string
): Promise<
  | { ok: true; user: User; org: Organization; role: OrgRole }
  | { ok: false; redirectTo: string }
> {
  const user = await getSessionUser();
  const org = await getOrgByHandle(handle);
  if (!org) return { ok: false, redirectTo: "/" };
  if (!user) return { ok: false, redirectTo: `/login?next=/o/${handle}/rehearsals` };
  const role = await getOrgRole(org.id, user.id);
  if (!role) return { ok: false, redirectTo: `/o/${handle}` };
  return { ok: true, user, org, role };
}

/**
 * 서버 컴포넌트(페이지/레이아웃)용 staff 가드.
 * handle로 org를 찾고 로그인·staff 여부를 확인해 컨텍스트를 돌려준다.
 * 실패 시 redirect 경로를 함께 반환(호출부에서 redirect() 호출).
 */
export async function loadStaffContextByHandle(
  handle: string
): Promise<
  | { ok: true; ctx: StaffContext }
  | { ok: false; redirectTo: string }
> {
  const user = await getSessionUser();
  const org = await getOrgByHandle(handle);
  if (!org) return { ok: false, redirectTo: "/" };
  if (!user) return { ok: false, redirectTo: `/login?next=/o/${handle}/manage` };

  const role = await getOrgRole(org.id, user.id);
  if (!isStaffRole(role)) return { ok: false, redirectTo: `/o/${handle}` };
  return { ok: true, ctx: { user, org, role: role! } };
}

/** 현재 유저가 소속된 단체 목록 + 역할 (없으면 빈 배열). */
export async function getUserMemberships(
  userId: string
): Promise<Array<{ role: OrgRole; org: Organization }>> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("org_members")
    .select("role, org:organizations(*)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });
  if (!data) return [];
  return data
    .filter((r) => r.org)
    .map((r) => ({
      role: r.role as OrgRole,
      org: r.org as unknown as Organization,
    }));
}
