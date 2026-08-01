import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import { ApplicantsManager, type ApplicantRow } from "./ApplicantsManager";

interface PageProps {
  params: Promise<{ handle: string; rid: string }>;
}

export default async function RecruitmentApplicantsPage({ params }: PageProps) {
  const { handle, rid } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  const svc = createServiceClient();
  const { data: rec } = await svc
    .from("recruitments")
    .select("id, title, status, is_public")
    .eq("id", rid)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!rec) notFound();

  const { data: apps } = await svc
    .from("applications")
    .select("id, name, part, phone, email, intro, attachment_url, status, created_at")
    .eq("recruitment_id", rid)
    .order("created_at", { ascending: false });

  const applicants = (apps ?? []) as ApplicantRow[];

  return (
    <ApplicantsManager
      handle={org.handle}
      recruitment={{
        id: rec.id,
        title: rec.title,
        status: rec.status,
        is_public: rec.is_public,
      }}
      initialApplicants={applicants}
    />
  );
}
