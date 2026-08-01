import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import { ApplicationForm } from "./ApplicationForm";

interface PageProps {
  params: Promise<{ handle: string; rid: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle, rid } = await params;
  const org = await getOrgByHandle(handle);
  const svc = createServiceClient();
  const { data: rec } = await svc
    .from("recruitments")
    .select("title")
    .eq("id", rid)
    .maybeSingle();
  return { title: `${rec?.title ?? "단원 모집"} · ${org?.name ?? ""} | THE PULSE` };
}

export default async function ApplyPage({ params }: PageProps) {
  const { handle, rid } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) notFound();

  const svc = createServiceClient();
  const { data: rec } = await svc
    .from("recruitments")
    .select("id, title, description, parts, headcount, deadline, status, is_public")
    .eq("id", rid)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!rec || !rec.is_public) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <p className="text-xs font-black tracking-widest text-primary uppercase mb-2">
        {org.name} · 단원 모집
      </p>
      <h1 className="editorial-title text-3xl font-black tracking-tighter text-on-surface mb-3">
        {rec.title}
      </h1>
      {rec.parts && (
        <p className="text-sm text-on-surface-variant">모집 파트 · {rec.parts}</p>
      )}
      {rec.deadline && (
        <p className="text-sm text-on-surface-variant">마감 · {rec.deadline}</p>
      )}
      {rec.description && (
        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line mt-4">
          {rec.description}
        </p>
      )}

      <div className="mt-8">
        {rec.status === "open" ? (
          <ApplicationForm recruitmentId={rec.id} />
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center">
            <p className="text-on-surface-variant">모집이 마감되었습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
