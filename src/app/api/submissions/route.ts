import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  validateSubmissionInput,
  artistLabel,
  type SubmissionInput,
} from "@/lib/submissions/validate";
import {
  sendNewSubmissionAdminAlert,
  sendSubmissionReceived,
} from "@/lib/notifications/sender";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function clientIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const result = validateSubmissionInput(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, field: result.field },
      { status: 400 }
    );
  }

  // Honeypot: respond 200 but do not persist
  if (result.isHoneypot) {
    console.warn("Submission honeypot triggered", {
      ip: clientIp(request),
      email: result.data.submitter_email,
    });
    return NextResponse.json({ ok: true });
  }

  const input: SubmissionInput = result.data;
  const supabase = createServerClient();
  const ip = clientIp(request);

  // IP-based rate limit (best-effort)
  if (ip) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("submitter_ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
  }

  // Duplicate check — already in performances?
  const { data: existingPerf } = await supabase
    .from("performances")
    .select("id")
    .ilike("title", input.title)
    .eq("start_date", input.start_date)
    .limit(1);
  if (existingPerf && existingPerf.length > 0) {
    return NextResponse.json(
      { error: "이미 등록된 공연으로 보입니다." },
      { status: 409 }
    );
  }

  // Duplicate check — already submitted (pending/approved)?
  const { data: existingSub } = await supabase
    .from("submissions")
    .select("id")
    .ilike("title", input.title)
    .eq("start_date", input.start_date)
    .in("status", ["pending", "approved"])
    .limit(1);
  if (existingSub && existingSub.length > 0) {
    return NextResponse.json(
      { error: "이미 동일한 공연 제보가 접수되어 있습니다." },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("submissions")
    .insert({
      submitter_email: input.submitter_email,
      submitter_name: input.submitter_name,
      submitter_ip: ip,
      submitter_note: input.submitter_note,
      artist_id: input.artist_id,
      proposed_artist_name_ko: input.proposed_artist_name_ko,
      proposed_artist_name_ja: input.proposed_artist_name_ja,
      proposed_artist_name_en: input.proposed_artist_name_en,
      title: input.title,
      venue: input.venue,
      city: input.city,
      start_date: input.start_date,
      end_date: input.end_date,
      ticket_open_at: input.ticket_open_at,
      presale_open_at: input.presale_open_at,
      price_info: input.price_info,
      image_url: input.image_url,
      source_url: input.source_url,
    })
    .select(
      "id, title, start_date, venue, submitter_email, artist_id, proposed_artist_name_ko, proposed_artist_name_en, artist:artists!submissions_artist_id_fkey(name_ko, name_en)"
    )
    .single();

  if (insertError || !inserted) {
    console.error("Failed to insert submission", insertError);
    return NextResponse.json(
      { error: "제보 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  const artistRel = inserted.artist as
    | { name_ko: string; name_en: string | null }
    | { name_ko: string; name_en: string | null }[]
    | null;
  const label = artistLabel({
    artist: Array.isArray(artistRel) ? (artistRel[0] ?? null) : artistRel,
    proposed_artist_name_ko: inserted.proposed_artist_name_ko,
    proposed_artist_name_en: inserted.proposed_artist_name_en,
  });

  // Fire-and-forget-ish emails (but awaited so errors are logged in this request lifecycle)
  await Promise.allSettled([
    sendSubmissionReceived({
      to: inserted.submitter_email,
      title: inserted.title,
      artistLabel: label,
      startDate: inserted.start_date,
    }),
    sendNewSubmissionAdminAlert({
      submissionId: inserted.id,
      submitterEmail: inserted.submitter_email,
      title: inserted.title,
      artistLabel: label,
      startDate: inserted.start_date,
      venue: inserted.venue,
    }),
  ]);

  return NextResponse.json({ ok: true, submissionId: inserted.id });
}
