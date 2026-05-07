import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendSubmissionRejected } from "@/lib/notifications/sender";

import { verifyAdminRequest as verifyAdmin } from "@/lib/admin/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const reason = (body.reason || "").trim();
  if (!reason) {
    return NextResponse.json(
      { error: "거절 사유를 입력해주세요." },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: submission, error: selErr } = await supabase
    .from("submissions")
    .select("id, status, submitter_email, title")
    .eq("id", id)
    .single();

  if (selErr || !submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (submission.status !== "pending") {
    return NextResponse.json(
      { error: "이미 검토가 완료된 제보입니다." },
      { status: 400 }
    );
  }

  const { error: updateErr } = await supabase
    .from("submissions")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: "제보 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }

  await sendSubmissionRejected({
    to: submission.submitter_email,
    title: submission.title,
    reason,
  });

  return NextResponse.json({ ok: true });
}
