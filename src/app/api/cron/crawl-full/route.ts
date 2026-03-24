import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { Yes24Crawler } from "@/lib/crawlers/yes24";
import { InterparkCrawler } from "@/lib/crawlers/interpark";
import { MelonCrawler } from "@/lib/crawlers/melon";
import { matchArtist, type ArtistKeyword } from "@/lib/crawlers/matcher";
import type { CrawlResult } from "@/lib/crawlers/base";
import type { Json } from "@/lib/supabase/types";
import artistKeywords from "@/lib/artists-keywords.json";

export const maxDuration = 300; // 5 minutes (Vercel Pro)

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const keywords = artistKeywords as ArtistKeyword[];
  const results: CrawlResult[] = [];
  const errors: string[] = [];

  // Crawl each site
  const crawlers = [
    new Yes24Crawler(),
    new InterparkCrawler(),
    new MelonCrawler(),
  ];

  for (const crawler of crawlers) {
    try {
      const listings = await crawler.crawlList();
      results.push(...listings);
    } catch (err) {
      errors.push(`${crawler.source}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  let inserted = 0;
  let matched = 0;

  for (const result of results) {
    // Upsert into source_listings
    const { data: listing } = await supabase
      .from("source_listings")
      .upsert(
        {
          source: result.source,
          source_url: result.sourceUrl,
          source_id: result.sourceId,
          raw_title: result.rawTitle,
          raw_data: result.rawData as unknown as Json,
          ticket_open_at: result.ticketOpenAt || null,
          price_info: result.priceInfo || null,
          last_crawled_at: new Date().toISOString(),
        },
        { onConflict: "source_url" }
      )
      .select()
      .single();

    if (!listing) continue;
    inserted++;

    // Skip if already linked to a performance
    if (listing.performance_id) continue;

    // Try to match artist
    const artistMatch = matchArtist(result.rawTitle, keywords);
    if (!artistMatch) continue;

    // Find or create artist
    let { data: artist } = await supabase
      .from("artists")
      .select()
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
        .select()
        .single();
      artist = newArtist;
    }

    if (!artist) continue;

    // Find existing performance or create new one
    const { data: existingPerfs } = await supabase
      .from("performances")
      .select()
      .eq("artist_id", artist.id)
      .gte("start_date", result.dates.start)
      .lte("start_date", result.dates.end || result.dates.start);

    let performanceId: string;

    if (existingPerfs && existingPerfs.length > 0) {
      performanceId = existingPerfs[0].id;
    } else {
      const { data: newPerf } = await supabase
        .from("performances")
        .insert({
          artist_id: artist.id,
          title: result.rawTitle,
          venue: result.venue || null,
          start_date: result.dates.start,
          end_date: result.dates.end || null,
          ticket_open_at: result.ticketOpenAt || null,
          presale_open_at: result.presaleOpenAt || null,
          price_info: result.priceInfo || null,
          image_url: result.imageUrl || null,
        })
        .select()
        .single();

      if (!newPerf) continue;
      performanceId = newPerf.id;
    }

    // Link source_listing to performance
    await supabase
      .from("source_listings")
      .update({ performance_id: performanceId })
      .eq("id", listing.id);

    matched++;
  }

  return NextResponse.json({
    success: true,
    crawled: results.length,
    inserted,
    matched,
    errors,
  });
}
