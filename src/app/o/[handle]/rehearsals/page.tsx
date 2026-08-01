import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { loadMemberContextByHandle } from "@/lib/orgs/permissions";
import { isStaffRole } from "@/lib/orgs/types";
import { isoToKstNaive } from "@/lib/utils/date";
import { MemberRehearsals, type MemberRehearsalRow } from "./MemberRehearsals";

export const metadata = { title: "연습 일정 | THE PULSE" };

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function OrgRehearsalsPage({ params }: PageProps) {
  const { handle } = await params;
  const result = await loadMemberContextByHandle(handle);
  if (!result.ok) redirect(result.redirectTo);

  const { org, user, role } = result;
  const svc = createServiceClient();

  const { data: rehs } = await svc
    .from("rehearsals")
    .select("id, title, starts_at, location, target_parts")
    .eq("org_id", org.id)
    .order("starts_at", { ascending: true });

  const ids = (rehs ?? []).map((r) => r.id);
  const myStatus = new Map<string, "going" | "not" | "maybe">();
  if (ids.length > 0) {
    const { data: mine } = await svc
      .from("rehearsal_attendances")
      .select("rehearsal_id, status")
      .eq("user_id", user.id)
      .in("rehearsal_id", ids);
    for (const a of mine ?? []) myStatus.set(a.rehearsal_id, a.status);
  }

  const rows: MemberRehearsalRow[] = (rehs ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    starts_at_local: isoToKstNaive(r.starts_at),
    location: r.location,
    target_parts: r.target_parts,
    myStatus: myStatus.get(r.id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <nav className="flex items-center gap-1.5 text-xs mb-6 text-on-surface-variant font-medium">
        <Link href={`/o/${org.handle}`} className="hover:text-primary transition-colors">
          {org.name}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-on-surface font-bold">연습 일정</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="editorial-title text-3xl font-black tracking-tighter text-on-surface">
          연습 일정
        </h1>
        {isStaffRole(role) && (
          <Link
            href={`/o/${org.handle}/manage/rehearsals`}
            className="text-sm font-bold text-on-surface-variant hover:text-primary transition"
          >
            관리 →
          </Link>
        )}
      </div>

      <MemberRehearsals initialRows={rows} />
    </div>
  );
}
