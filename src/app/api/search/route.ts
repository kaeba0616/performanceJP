import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createServiceClient();
  const pattern = `%${q}%`;

  // 아티스트 매칭
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .or(`name_ko.ilike.${pattern},name_en.ilike.${pattern},name_ja.ilike.${pattern}`);

  if (!artists || artists.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const artistIds = artists.map((a) => a.id);

  // 매칭된 아티스트가 출연한 모든 공연 (단독 + 페스티벌) — junction 통해
  const { data: junctionRows } = await supabase
    .from("performance_artists")
    .select("performance_id, artist_id")
    .in("artist_id", artistIds);

  const perfIds = Array.from(new Set((junctionRows ?? []).map((r) => r.performance_id)));

  const { data: performances } =
    perfIds.length > 0
      ? await supabase
          .from("performances")
          .select("*, source_listings(*)")
          .in("id", perfIds)
          .order("start_date", { ascending: true })
      : { data: [] };

  // 아티스트별로 그룹핑 — junction 매핑으로 결정 (artist_id 직접 매칭이 아닌)
  const perfsByArtist = new Map<string, string[]>();
  for (const row of junctionRows ?? []) {
    const list = perfsByArtist.get(row.artist_id) ?? [];
    list.push(row.performance_id);
    perfsByArtist.set(row.artist_id, list);
  }

  const perfMap = new Map((performances ?? []).map((p) => [p.id, p]));

  const results = artists.map((artist) => ({
    artist,
    performances: (perfsByArtist.get(artist.id) ?? [])
      .map((pid) => perfMap.get(pid))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .sort((a, b) => a.start_date.localeCompare(b.start_date)),
  }));

  return NextResponse.json({ results });
}
