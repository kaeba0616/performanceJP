import Link from "next/link";
import { Plus } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";
import { formatDate } from "@/lib/utils/date";

interface PageProps {
  params: Promise<{ handle: string }>;
}

const VISIBILITY_BADGE: Record<string, { label: string; className: string }> = {
  public: { label: "공개", className: "bg-primary/15 text-primary" },
  unlisted: { label: "링크공개", className: "bg-secondary/15 text-secondary" },
  private: { label: "초안", className: "bg-surface-container-high text-on-surface-variant" },
};

export default async function ManagePerformancesPage({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null;

  const svc = createServiceClient();
  const { data: perfs } = await svc
    .from("performances")
    .select("id, title, start_date, venue, visibility")
    .eq("org_id", org.id)
    .order("start_date", { ascending: false });

  const performances = perfs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-on-surface">공연 ({performances.length})</h2>
        <Link
          href={`/o/${org.handle}/manage/performances/new`}
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-bold text-sm py-2 px-4 rounded-full hover:bg-primary-container transition"
        >
          <Plus className="w-4 h-4" />새 공연
        </Link>
      </div>

      {performances.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
          <p className="text-on-surface-variant">아직 공연이 없어요. 새 공연을 개설해보세요.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {performances.map((p) => {
            const badge = VISIBILITY_BADGE[p.visibility] ?? VISIBILITY_BADGE.private;
            return (
              <li key={p.id}>
                <Link
                  href={`/o/${org.handle}/manage/performances/${p.id}/edit`}
                  className="flex items-center gap-3 bg-surface-container-lowest rounded-xl border border-outline-variant p-4 hover:bg-surface-container-low transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface truncate">{p.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {formatDate(p.start_date)}
                      {p.venue ? ` · ${p.venue}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
