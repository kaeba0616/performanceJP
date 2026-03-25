import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createServerClient } from "@/lib/supabase/server";
import { matchArtist, hasJapaneseCharacters, type ArtistKeyword } from "@/lib/crawlers/matcher";
import { parseKoreanDate } from "@/lib/crawlers/base";
import artistKeywords from "@/lib/artists-keywords.json";

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

interface SearchResult {
  sourceId: string;
  sourceUrl: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  imageUrl: string | null;
  matchedArtist: { ko: string; en: string; ja: string } | null;
  hasJapanese: boolean;
  imported: boolean;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = request.nextUrl.searchParams.get("page") || "1";
  const pageSize = request.nextUrl.searchParams.get("pageSize") || "40";

  // Fetch Yes24 concert listing via their AJAX API
  const url = `https://ticket.yes24.com/New/Genre/Ajax/GenreList_Data.aspx?genre=15456&genretype=1&sort=1&area=&pCurPage=${page}&pPageSize=${pageSize}`;

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer:
          "https://ticket.yes24.com/New/Genre/GenreList.aspx?genretype=1&genre=15456",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    html = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch: ${err}` },
      { status: 502 }
    );
  }

  const $ = cheerio.load(html);
  const keywords = artistKeywords as ArtistKeyword[];
  const results: SearchResult[] = [];

  // Extract total count
  const totalCount = parseInt($("#ListTotalCnt").val() as string) || 0;

  // Parse each listing
  $("a[onclick*='jsf_base_GoToPerfDetail']").each((_, el) => {
    const onclickAttr = $(el).attr("onclick") || "";
    const idMatch = onclickAttr.match(/GoToPerfDetail\((\d+)\)/);
    if (!idMatch) return;

    const sourceId = idMatch[1];
    const sourceUrl = `https://ticket.yes24.com/Perf/${sourceId}`;

    const title = $(el).find(".list-b-tit1").text().trim();
    if (!title) return;

    // Date and venue are both .list-b-tit2
    const tit2Elements = $(el).find(".list-b-tit2");
    const dateText = tit2Elements.eq(0).text().trim();
    const venue = tit2Elements.eq(1).text().trim() || null;

    // Parse dates
    let startDate: string | null = null;
    let endDate: string | null = null;
    const rangeMatch = dateText.match(
      /(\d{4}\.\d{1,2}\.\d{1,2})\s*~\s*(\d{4}\.\d{1,2}\.\d{1,2})/
    );
    if (rangeMatch) {
      startDate = parseKoreanDate(rangeMatch[1]);
      endDate = parseKoreanDate(rangeMatch[2]);
    } else {
      startDate = parseKoreanDate(dateText);
    }

    // Image
    const imgSrc =
      $(el).find("img").attr("data-src") ||
      $(el).find("img").attr("src") ||
      null;
    const imageUrl = imgSrc
      ? imgSrc.startsWith("//")
        ? `https:${imgSrc}`
        : imgSrc
      : null;

    // Artist matching
    const matchedArtist = matchArtist(title, keywords);
    const hasJapanese = hasJapaneseCharacters(title);

    results.push({
      sourceId,
      sourceUrl,
      title,
      startDate,
      endDate: endDate !== startDate ? endDate : null,
      venue,
      imageUrl,
      matchedArtist,
      hasJapanese,
      imported: false,
    });
  });

  // Check which ones are already in DB
  if (results.length > 0) {
    const supabase = createServerClient();
    const sourceUrls = results.map((r) => r.sourceUrl);
    const { data: existing } = await supabase
      .from("source_listings")
      .select("source_url")
      .in("source_url", sourceUrls);

    const existingUrls = new Set(
      (existing || []).map((e) => e.source_url)
    );
    results.forEach((r) => {
      r.imported = existingUrls.has(r.sourceUrl);
    });
  }

  return NextResponse.json({
    results,
    totalCount,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
}
