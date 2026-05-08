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
    .select("*, performances(count)")
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
  const { name_ko, name_ja, name_en, hit_songs } = body;

  if (!name_ko) {
    return NextResponse.json(
      { error: "name_ko is required" },
      { status: 400 }
    );
  }

  const cleanedSongs = normalizeSongs(hit_songs);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("artists")
    .insert({
      name_ko,
      name_ja,
      name_en,
      hit_songs: (cleanedSongs.length ? cleanedSongs : null) as Json | null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, artist: data });
}
