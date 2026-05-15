import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { normalizeSongs } from "@/types";

import { verifyAdminRequest as verifyAdmin } from "@/lib/admin/auth";

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("artists")
    .select(
      "*, performances:performance_artists(count), memberships:artist_memberships!artist_memberships_group_id_fkey(display_order, member:artists!artist_memberships_member_id_fkey(id, name_ko, name_en, image_url))"
    )
    .order("name_ko");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ artists: data });
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name_ko, name_ja, name_en, hit_songs, image_url, members } = body;

  if (!name_ko) {
    return NextResponse.json(
      { error: "name_ko is required" },
      { status: 400 }
    );
  }

  const cleanedSongs = normalizeSongs(hit_songs);
  const memberIds: string[] = Array.isArray(members)
    ? (members as unknown[]).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("artists")
    .insert({
      name_ko,
      name_ja,
      name_en,
      image_url: image_url || null,
      hit_songs: (cleanedSongs.length ? cleanedSongs : null) as Json | null,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
  }

  if (memberIds.length > 0) {
    const rows = memberIds
      .filter((mid) => mid !== data.id)
      .map((mid, i) => ({ group_id: data.id, member_id: mid, display_order: i + 1 }));
    if (rows.length > 0) {
      const { error: mErr } = await supabase.from("artist_memberships").insert(rows);
      if (mErr) {
        await supabase.from("artists").delete().eq("id", data.id);
        return NextResponse.json({ error: `멤버 저장 실패: ${mErr.message}` }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true, artist: data });
}
