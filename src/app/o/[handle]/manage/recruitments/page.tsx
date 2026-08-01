import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import { RecruitmentsManager, type RecruitmentRow } from "./RecruitmentsManager";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ManageRecruitmentsPage({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  const svc = createServiceClient();
  const { data: recs } = await svc
    .from("recruitments")
    .select("id, title, parts, status, is_public, deadline, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  // 지원자 수 집계
  const ids = (recs ?? []).map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: apps } = await svc
      .from("applications")
      .select("recruitment_id")
      .in("recruitment_id", ids);
    for (const a of apps ?? []) {
      counts.set(a.recruitment_id, (counts.get(a.recruitment_id) ?? 0) + 1);
    }
  }

  const rows: RecruitmentRow[] = (recs ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    parts: r.parts,
    status: r.status,
    is_public: r.is_public,
    deadline: r.deadline,
    applicantCount: counts.get(r.id) ?? 0,
  }));

  return (
    <RecruitmentsManager orgId={org.id} handle={org.handle} initialRows={rows} />
  );
}
