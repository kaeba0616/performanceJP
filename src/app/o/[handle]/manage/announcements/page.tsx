import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import {
  AnnouncementsManager,
  type AnnouncementRow,
  type PerfOption,
} from "./AnnouncementsManager";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ManageAnnouncementsPage({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  const svc = createServiceClient();
  const [{ data: anns }, { data: perfs }] = await Promise.all([
    svc
      .from("announcements")
      .select("id, title, body, audience, sent_at, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    svc
      .from("performances")
      .select("id, title")
      .eq("org_id", org.id)
      .order("start_date", { ascending: false }),
  ]);

  const announcements = (anns ?? []) as AnnouncementRow[];
  const performances = (perfs ?? []) as PerfOption[];

  return (
    <AnnouncementsManager
      orgId={org.id}
      initialAnnouncements={announcements}
      performances={performances}
    />
  );
}
