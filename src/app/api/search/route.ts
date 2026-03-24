import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createServerClient();
  const pattern = `%${q}%`;

  // Search artists by Korean, English, or Japanese name
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .or(`name_ko.ilike.${pattern},name_en.ilike.${pattern},name_ja.ilike.${pattern}`);

  if (!artists || artists.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // Get performances + ticket links for matched artists
  const artistIds = artists.map((a) => a.id);
  const { data: performances } = await supabase
    .from("performances")
    .select("*, source_listings(*)")
    .in("artist_id", artistIds)
    .order("start_date", { ascending: true });

  // Group performances by artist
  const results = artists.map((artist) => ({
    artist,
    performances: (performances || []).filter(
      (p) => p.artist_id === artist.id
    ),
  }));

  return NextResponse.json({ results });
}
