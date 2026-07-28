import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireOrgStaff } from "@/lib/orgs/permissions";
import { sendAnnouncementEmail } from "@/lib/notifications/sender";

// POST /api/announcements/:id/send — 대상에게 이메일 발송 후 sent_at 기록.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const svc = createServiceClient();

  const { data: ann } = await svc
    .from("announcements")
    .select("id, org_id, performance_id, title, body, audience, sent_at")
    .eq("id", id)
    .maybeSingle();
  if (!ann) {
    return NextResponse.json({ error: "공지를 찾을 수 없습니다." }, { status: 404 });
  }

  const guard = await requireOrgStaff(ann.org_id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { data: org } = await svc
    .from("organizations")
    .select("name")
    .eq("id", ann.org_id)
    .maybeSingle();
  const orgName = org?.name ?? "";

  // 대상 이메일 수집
  const emails = new Set<string>();

  if (ann.audience === "reservers") {
    let q = svc
      .from("reservations")
      .select("email, performance:performances!inner(org_id)")
      .eq("performance.org_id", ann.org_id)
      .in("status", ["pending", "confirmed"])
      .not("email", "is", null);
    if (ann.performance_id) q = q.eq("performance_id", ann.performance_id);
    const { data } = await q;
    for (const r of data ?? []) {
      if (r.email) emails.add(r.email.trim().toLowerCase());
    }
  } else if (ann.audience === "members") {
    const { data: members } = await svc
      .from("org_members")
      .select("user_id")
      .eq("org_id", ann.org_id);
    for (const m of members ?? []) {
      const { data } = await svc.auth.admin.getUserById(m.user_id);
      const email = data.user?.email;
      if (email) emails.add(email.trim().toLowerCase());
    }
  }
  // 'public' 은 개별 발송 없이 게시만 (sent_at 만 설정)

  // 이미 발송된 수신자 제외 (재발송 idempotent)
  const { data: prior } = await svc
    .from("announcement_deliveries")
    .select("recipient")
    .eq("announcement_id", id)
    .eq("channel", "email");
  const alreadySent = new Set((prior ?? []).map((d) => d.recipient));

  let sent = 0;
  for (const email of emails) {
    if (alreadySent.has(email)) continue;
    const ok = await sendAnnouncementEmail({
      to: email,
      orgName,
      title: ann.title,
      body: ann.body,
    });
    if (ok) {
      await svc.from("announcement_deliveries").insert({
        announcement_id: id,
        channel: "email",
        recipient: email,
      });
      sent += 1;
    }
  }

  // 발송 완료 시각 기록 (최초 발송 시)
  if (!ann.sent_at) {
    await svc
      .from("announcements")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true, sent, targeted: emails.size });
}
