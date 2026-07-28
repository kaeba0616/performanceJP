import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import { isoToKstNaive } from "@/lib/utils/date";
import { PerformanceEditor, type ShowItem } from "./PerformanceEditor";

interface PageProps {
  params: Promise<{ handle: string; perfId: string }>;
}

export default async function EditPerformancePage({ params }: PageProps) {
  const { handle, perfId } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  const svc = createServiceClient();
  const { data: perf } = await svc
    .from("performances")
    .select("*")
    .eq("id", perfId)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!perf) notFound();

  const { data: showRows } = await svc
    .from("performance_shows")
    .select("id, starts_at, capacity, label")
    .eq("performance_id", perfId)
    .order("starts_at", { ascending: true });

  const shows: ShowItem[] = (showRows ?? []).map((s) => ({
    id: s.id,
    starts_at_local: isoToKstNaive(s.starts_at),
    capacity: s.capacity,
    label: s.label,
  }));

  return (
    <PerformanceEditor
      handle={org.handle}
      perf={{
        id: perf.id,
        title: perf.title,
        summary: perf.summary,
        venue: perf.venue,
        city: perf.city,
        start_date: perf.start_date,
        end_date: perf.end_date,
        price_info: perf.price_info,
        poster_url: perf.poster_url,
        image_url: perf.image_url,
        ticket_open_local: perf.ticket_open_at ? isoToKstNaive(perf.ticket_open_at) : "",
        visibility: perf.visibility,
      }}
      initialShows={shows}
    />
  );
}
