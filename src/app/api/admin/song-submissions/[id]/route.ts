import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeSongs } from "@/types";
import type { Json } from "@/lib/supabase/types";

import { verifyAdminRequest as verifyAdmin } from "@/lib/admin/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("song_submissions")
    .select(
      "*, performance:performances!song_submissions_performance_id_fkey(id, title, start_date, venue, setlist), artist:artists!song_submissions_artist_id_fkey(id, name_ko, name_en, hit_songs)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ submission: data });
}

// PUT — 승인(approve) 또는 거절(reject).
//   action='approve' songs=[]  → 대상의 setlist/hit_songs를 songs로 대체 + status=approved
//   action='reject' rejection_reason → status=rejected
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  const supabase = createServiceClient();
  const { data: sub, error: getErr } = await supabase
    .from("song_submissions")
    .select("*")
    .eq("id", id)
    .single();
  if (getErr || !sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "approve") {
    const songs = normalizeSongs(body.songs ?? sub.songs);
    if (songs.length === 0) {
      return NextResponse.json({ error: "곡이 비어있습니다." }, { status: 400 });
    }
    const value = songs as unknown as Json;

    if (sub.kind === "setlist" && sub.performance_id) {
      const { error: e1 } = await supabase
        .from("performances")
        .update({ setlist: value })
        .eq("id", sub.performance_id);
      if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
    } else if (sub.kind === "hit_songs" && sub.artist_id) {
      const { error: e2 } = await supabase
        .from("artists")
        .update({ hit_songs: value })
        .eq("id", sub.artist_id);
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "대상이 잘못되었습니다." }, { status: 400 });
    }

    const { error: e3 } = await supabase
      .from("song_submissions")
      .update({
        status: "approved",
        songs: value,
        admin_note: typeof body.admin_note === "string" ? body.admin_note : null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    const reason = typeof body.rejection_reason === "string" ? body.rejection_reason : null;
    const { error: e } = await supabase
      .from("song_submissions")
      .update({
        status: "rejected",
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (e) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action은 approve 또는 reject 이어야 합니다." }, { status: 400 });
}
