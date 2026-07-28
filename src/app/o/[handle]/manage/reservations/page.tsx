import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import { formatShowTime } from "@/lib/utils/date";
import { ReservationsTable, type ReservationRow } from "./ReservationsTable";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ManageReservationsPage({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  const svc = createServiceClient();
  const { data } = await svc
    .from("reservations")
    .select(
      "id, name, party_size, phone, email, status, note, created_at, performance:performances!inner(id, title, org_id), show:performance_shows(label, starts_at)"
    )
    .eq("performance.org_id", org.id)
    .order("created_at", { ascending: false });

  const rows: ReservationRow[] = (
    (data ?? []) as unknown as Array<{
      id: string;
      name: string;
      party_size: number;
      phone: string | null;
      email: string | null;
      status: ReservationRow["status"];
      note: string | null;
      created_at: string;
      performance: { id: string; title: string } | null;
      show: { label: string | null; starts_at: string } | null;
    }>
  ).map((r) => ({
    id: r.id,
    name: r.name,
    party_size: r.party_size,
    phone: r.phone,
    email: r.email,
    status: r.status,
    note: r.note,
    performanceTitle: r.performance?.title ?? "",
    showLabel: r.show ? r.show.label || formatShowTime(r.show.starts_at) : null,
  }));

  return <ReservationsTable orgId={org.id} initialRows={rows} />;
}
