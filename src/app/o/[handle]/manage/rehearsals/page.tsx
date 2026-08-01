import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import { isoToKstNaive } from "@/lib/utils/date";
import { RehearsalsManager, type RehearsalRow } from "./RehearsalsManager";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ManageRehearsalsPage({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  const svc = createServiceClient();
  const [{ data: rehs }, { count: memberCount }] = await Promise.all([
    svc
      .from("rehearsals")
      .select("id, title, starts_at, location, target_parts")
      .eq("org_id", org.id)
      .order("starts_at", { ascending: true }),
    svc
      .from("org_members")
      .select("user_id", { count: "exact", head: true })
      .eq("org_id", org.id),
  ]);

  const ids = (rehs ?? []).map((r) => r.id);
  const counts = new Map<string, { going: number; maybe: number; not: number }>();
  if (ids.length > 0) {
    const { data: atts } = await svc
      .from("rehearsal_attendances")
      .select("rehearsal_id, status")
      .in("rehearsal_id", ids);
    for (const a of atts ?? []) {
      const c = counts.get(a.rehearsal_id) ?? { going: 0, maybe: 0, not: 0 };
      if (a.status === "going") c.going += 1;
      else if (a.status === "maybe") c.maybe += 1;
      else if (a.status === "not") c.not += 1;
      counts.set(a.rehearsal_id, c);
    }
  }

  const rows: RehearsalRow[] = (rehs ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    starts_at_local: isoToKstNaive(r.starts_at),
    location: r.location,
    target_parts: r.target_parts,
    going: counts.get(r.id)?.going ?? 0,
    maybe: counts.get(r.id)?.maybe ?? 0,
    not: counts.get(r.id)?.not ?? 0,
  }));

  return (
    <RehearsalsManager
      orgId={org.id}
      memberCount={memberCount ?? 0}
      initialRows={rows}
    />
  );
}
