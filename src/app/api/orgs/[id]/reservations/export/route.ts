import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";
import { RESERVATION_STATUS_LABEL, type ReservationStatus } from "@/lib/orgs/types";
import { formatShowTime } from "@/lib/utils/date";

// GET /api/orgs/:id/reservations/export?performance= — 예약 명단 CSV (staff).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;
  const guard = await requireOrgStaff(orgId);
  if (!guard.ok) {
    return new Response(JSON.stringify({ error: guard.error }), {
      status: guard.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const perfFilter = url.searchParams.get("performance");

  const svc = createServiceClient();
  let query = svc
    .from("reservations")
    .select(
      "name, party_size, phone, email, status, note, created_at, performance:performances!inner(title, org_id), show:performance_shows(label, starts_at)"
    )
    .eq("performance.org_id", orgId)
    .order("created_at", { ascending: false });
  if (perfFilter) query = query.eq("performance_id", perfFilter);

  const { data } = await query;
  const rows = (data ?? []) as unknown as Array<{
    name: string;
    party_size: number;
    phone: string | null;
    email: string | null;
    status: ReservationStatus;
    note: string | null;
    created_at: string;
    performance: { title: string } | null;
    show: { label: string | null; starts_at: string } | null;
  }>;

  const header = [
    "공연",
    "회차",
    "이름",
    "인원",
    "연락처",
    "이메일",
    "상태",
    "요청사항",
    "예약일시",
  ];

  const esc = (v: string | number | null) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [header.join(",")];
  for (const r of rows) {
    const showLabel = r.show
      ? r.show.label || formatShowTime(r.show.starts_at)
      : "";
    lines.push(
      [
        esc(r.performance?.title ?? ""),
        esc(showLabel),
        esc(r.name),
        esc(r.party_size),
        esc(r.phone),
        esc(r.email),
        esc(RESERVATION_STATUS_LABEL[r.status] ?? r.status),
        esc(r.note),
        esc(r.created_at),
      ].join(",")
    );
  }

  // UTF-8 BOM (엑셀 한글 깨짐 방지)
  const csv = "﻿" + lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${orgId}.csv"`,
    },
  });
}
