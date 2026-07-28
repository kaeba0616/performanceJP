import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgByHandle } from "@/lib/orgs/permissions";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ManageDashboard({ params }: PageProps) {
  const { handle } = await params;
  const org = await getOrgByHandle(handle);
  if (!org) return null; // layout guard가 이미 처리

  const svc = createServiceClient();

  const [{ data: perfs }, { count: reservationCount }] = await Promise.all([
    svc
      .from("performances")
      .select("id, title, start_date, visibility")
      .eq("org_id", org.id),
    svc
      .from("reservations")
      .select("id, performance:performances!inner(org_id)", {
        count: "exact",
        head: true,
      })
      .eq("performance.org_id", org.id)
      .in("status", ["pending", "confirmed"]),
  ]);

  const total = perfs?.length ?? 0;
  const published =
    perfs?.filter((p) => p.visibility !== "private").length ?? 0;
  const drafts = total - published;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="공연" value={String(total)} />
        <Stat label="발행됨" value={String(published)} />
        <Stat label="초안" value={String(drafts)} />
        <Stat label="예약(유효)" value={String(reservationCount ?? 0)} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink
          href={`/o/${org.handle}/manage/performances/new`}
          title="공연 개설"
          desc="새 공연 홍보 페이지를 만들고 발행하세요"
        />
        <QuickLink
          href={`/o/${org.handle}/manage/announcements`}
          title="공지 작성"
          desc="단원·예약자에게 공지를 발송하세요"
        />
        <QuickLink
          href={`/o/${org.handle}/manage/reservations`}
          title="예약 관리"
          desc="예약 명단을 확인하고 CSV로 내보내세요"
        />
        <QuickLink
          href={`/o/${org.handle}/manage/members`}
          title="멤버 관리"
          desc="운영진·단원을 초대하고 역할을 관리하세요"
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
      <div className="text-2xl font-black tracking-tighter text-primary">{value}</div>
      <div className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mt-1">
        {label}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 hover:bg-surface-container-low transition"
    >
      <p className="font-bold text-on-surface mb-1">{title}</p>
      <p className="text-sm text-on-surface-variant">{desc}</p>
    </Link>
  );
}
