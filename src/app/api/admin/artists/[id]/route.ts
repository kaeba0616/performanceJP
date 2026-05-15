import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { normalizeSongs } from "@/types";

import { verifyAdminRequest as verifyAdmin } from "@/lib/admin/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    name_ko,
    name_ja,
    name_en,
    image_url,
    instagram_url,
    youtube_url,
    x_url,
    hit_songs,
    members,
  } = body;

  const cleanedSongs =
    hit_songs === null || hit_songs === undefined
      ? hit_songs ?? undefined
      : normalizeSongs(hit_songs);
  const hitSongsValue =
    cleanedSongs === undefined
      ? undefined
      : Array.isArray(cleanedSongs) && cleanedSongs.length === 0
        ? null
        : cleanedSongs;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("artists")
    .update({
      name_ko,
      name_ja,
      name_en,
      image_url,
      instagram_url,
      youtube_url,
      x_url,
      ...(hitSongsValue !== undefined
        ? { hit_songs: hitSongsValue as Json | null }
        : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 멤버 동기화: members 배열이 명시적으로 들어왔을 때만 처리 (undefined면 그대로 유지)
  if (Array.isArray(members)) {
    const memberIds = (members as unknown[])
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .filter((mid) => mid !== id);

    const { error: delErr } = await supabase
      .from("artist_memberships")
      .delete()
      .eq("group_id", id);
    if (delErr) {
      return NextResponse.json({ error: `멤버 정리 실패: ${delErr.message}` }, { status: 500 });
    }

    if (memberIds.length > 0) {
      const rows = memberIds.map((mid, i) => ({
        group_id: id,
        member_id: mid,
        display_order: i + 1,
      }));
      const { error: insErr } = await supabase.from("artist_memberships").insert(rows);
      if (insErr) {
        return NextResponse.json({ error: `멤버 저장 실패: ${insErr.message}` }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true, artist: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("artists")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
