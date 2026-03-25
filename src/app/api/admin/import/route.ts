import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { matchArtist, type ArtistKeyword } from "@/lib/crawlers/matcher";
import artistKeywords from "@/lib/artists-keywords.json";

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

interface ImportItem {
  sourceId: string;
  sourceUrl: string;
  title: string;
  startDate: string;
  endDate: string | null;
  venue: string | null;
  imageUrl: string | null;
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = (await request.json()) as { items: ImportItem[] };
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const supabase = createServerClient();
  const keywords = artistKeywords as ArtistKeyword[];
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    // Check if already imported
    const { data: existing } = await supabase
      .from("source_listings")
      .select("id")
      .eq("source_url", item.sourceUrl)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    // Match artist
    const artistMatch = matchArtist(item.title, keywords);
    let artistId: string | null = null;

    if (artistMatch) {
      // Find or create artist
      let { data: artist } = await supabase
        .from("artists")
        .select("id")
        .eq("name_en", artistMatch.en)
        .single();

      if (!artist) {
        const { data: newArtist } = await supabase
          .from("artists")
          .insert({
            name_ko: artistMatch.ko,
            name_ja: artistMatch.ja,
            name_en: artistMatch.en,
          })
          .select("id")
          .single();
        artist = newArtist;
      }

      artistId = artist?.id || null;
    }

    // Create performance
    const { data: perf, error: perfError } = await supabase
      .from("performances")
      .insert({
        artist_id: artistId,
        title: item.title,
        venue: item.venue,
        start_date: item.startDate,
        end_date: item.endDate,
        image_url: item.imageUrl,
        status: "upcoming",
      })
      .select("id")
      .single();

    if (perfError || !perf) {
      errors.push(`${item.title}: ${perfError?.message || "failed"}`);
      continue;
    }

    // Create source listing
    await supabase.from("source_listings").insert({
      performance_id: perf.id,
      source: "yes24",
      source_url: item.sourceUrl,
      source_id: item.sourceId,
      raw_title: item.title,
    });

    imported++;
  }

  return NextResponse.json({ imported, skipped, errors });
}
