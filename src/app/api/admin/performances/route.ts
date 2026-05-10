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
    .from("performances")
    .select("*, artist:artists!performances_artist_id_fkey(id, name_ko, name_en), source_listings(count)")
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ performances: data });
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    type: typeRaw,
    artist_id: artistIdRaw,
    lineup: lineupRaw,
    title,
    venue,
    city,
    start_date,
    end_date,
    ticket_open_at,
    presale_open_at,
    price_info,
    status,
    image_url,
    setlist,
  } = body;

  if (!title || !start_date) {
    return NextResponse.json(
      { error: "title and start_date are required" },
      { status: 400 }
    );
  }

  const type: "solo" | "festival" = typeRaw === "festival" ? "festival" : "solo";
  const artist_id = typeof artistIdRaw === "string" && artistIdRaw ? artistIdRaw : null;
  const lineup: string[] = Array.isArray(lineupRaw)
    ? (lineupRaw as unknown[]).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];

  // 비즈니스 검증
  if (type === "solo") {
    if (!artist_id) {
      return NextResponse.json(
        { error: "단독 공연은 아티스트가 필요합니다." },
        { status: 400 }
      );
    }
  } else {
    // festival
    if (lineup.length === 0) {
      return NextResponse.json(
        { error: "페스티벌은 라인업에 1명 이상의 아티스트가 필요합니다." },
        { status: 400 }
      );
    }
    if (artist_id && !lineup.includes(artist_id)) {
      return NextResponse.json(
        { error: "대표 아티스트는 라인업에 포함되어야 합니다." },
        { status: 400 }
      );
    }
  }

  // solo는 lineup 자동
  const lineupToSave = type === "solo" ? [artist_id as string] : lineup;

  const cleanedSetlist = normalizeSongs(setlist);
  const supabase = createServiceClient();

  const { data: perf, error: perfErr } = await supabase
    .from("performances")
    .insert({
      type,
      artist_id,
      title,
      venue,
      city,
      start_date,
      end_date,
      ticket_open_at,
      presale_open_at,
      price_info,
      status,
      image_url,
      setlist: (cleanedSetlist.length ? cleanedSetlist : null) as Json | null,
    })
    .select()
    .single();

  if (perfErr || !perf) {
    return NextResponse.json({ error: perfErr?.message ?? "insert failed" }, { status: 500 });
  }

  // junction 동기화
  const rows = lineupToSave.map((aid, i) => ({
    performance_id: perf.id,
    artist_id: aid,
    display_order: i + 1,
  }));
  const { error: paErr } = await supabase.from("performance_artists").insert(rows);

  if (paErr) {
    // 롤백: perf 삭제 (junction 실패 시 orphan 방지)
    await supabase.from("performances").delete().eq("id", perf.id);
    return NextResponse.json(
      { error: `라인업 저장 실패: ${paErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, performance: perf });
}
