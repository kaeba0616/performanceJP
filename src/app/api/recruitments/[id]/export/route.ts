import { createServiceClient } from "@/lib/supabase/server";
import { requireRecruitmentOrgStaff } from "@/lib/orgs/permissions";
import { APPLICATION_STATUS_LABEL, type ApplicationStatus } from "@/lib/orgs/types";

// GET /api/recruitments/:id/export — 지원자 명단 CSV (staff).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireRecruitmentOrgStaff(id);
  if (!guard.ok) {
    return new Response(JSON.stringify({ error: guard.error }), {
      status: guard.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const svc = createServiceClient();
  const { data } = await svc
    .from("applications")
    .select("name, part, phone, email, intro, attachment_url, status, created_at")
    .eq("recruitment_id", id)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const header = ["이름", "지원파트", "연락처", "이메일", "자기소개", "첨부", "상태", "지원일시"];
  const esc = (v: string | null) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        esc(r.name),
        esc(r.part),
        esc(r.phone),
        esc(r.email),
        esc(r.intro),
        esc(r.attachment_url),
        esc(APPLICATION_STATUS_LABEL[r.status as ApplicationStatus] ?? r.status),
        esc(r.created_at),
      ].join(",")
    );
  }
  const csv = "﻿" + lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applicants-${id}.csv"`,
    },
  });
}
