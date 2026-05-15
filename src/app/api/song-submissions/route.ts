import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeSongs } from "@/types";
import type { Json } from "@/lib/supabase/types";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clientIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

function toOptStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
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
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;

  const kind = raw.kind === "hit_songs" ? "hit_songs" : raw.kind === "setlist" ? "setlist" : null;
  if (!kind) {
    return NextResponse.json({ error: "kind는 setlist 또는 hit_songs 이어야 합니다." }, { status: 400 });
  }

  const performance_id = toOptStr(raw.performance_id);
  const artist_id = toOptStr(raw.artist_id);
  if (kind === "setlist" && (!performance_id || !UUID_RE.test(performance_id))) {
    return NextResponse.json({ error: "performance_id가 필요합니다." }, { status: 400 });
  }
  if (kind === "hit_songs" && (!artist_id || !UUID_RE.test(artist_id))) {
    return NextResponse.json({ error: "artist_id가 필요합니다." }, { status: 400 });
  }

  const submitter_email = (typeof raw.submitter_email === "string" ? raw.submitter_email.trim() : "").toLowerCase();
  if (!submitter_email || !EMAIL_RE.test(submitter_email)) {
    return NextResponse.json({ error: "유효한 이메일 주소를 입력해주세요." }, { status: 400 });
  }

  const songs = normalizeSongs(raw.songs);
  if (songs.length === 0) {
    return NextResponse.json({ error: "곡을 하나 이상 입력해주세요." }, { status: 400 });
  }
  if (songs.length > 100) {
    return NextResponse.json({ error: "곡이 너무 많습니다." }, { status: 400 });
  }

  // Honeypot
  const website = typeof raw.website === "string" ? raw.website : "";
  if (website.trim().length > 0) {
    console.warn("Song submission honeypot triggered", { ip: clientIp(request), email: submitter_email });
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();
  const ip = clientIp(request);

  // 대상 존재 확인
  if (kind === "setlist") {
    const { data: p } = await supabase.from("performances").select("id").eq("id", performance_id!).single();
    if (!p) return NextResponse.json({ error: "공연을 찾을 수 없습니다." }, { status: 404 });
  } else {
    const { data: a } = await supabase.from("artists").select("id").eq("id", artist_id!).single();
    if (!a) return NextResponse.json({ error: "아티스트를 찾을 수 없습니다." }, { status: 404 });
  }

  // IP 기반 rate limit (best-effort)
  if (ip) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("song_submissions")
      .select("id", { count: "exact", head: true })
      .eq("submitter_ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("song_submissions")
    .insert({
      kind,
      performance_id: kind === "setlist" ? performance_id : null,
      artist_id: kind === "hit_songs" ? artist_id : null,
      submitter_email,
      submitter_name: toOptStr(raw.submitter_name),
      submitter_note: toOptStr(raw.submitter_note),
      submitter_ip: ip,
      songs: songs as unknown as Json,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Failed to insert song submission", insertError);
    return NextResponse.json({ error: "제보 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submissionId: inserted.id });
}
