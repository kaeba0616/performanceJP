import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { kstNaiveToISO } from "@/lib/utils/date";

import { verifyAdminRequest as verifyAdmin } from "@/lib/admin/auth";

const KST_TIMESTAMP_FIELDS = new Set(["ticket_open_at", "presale_open_at"]);

const EDITABLE_FIELDS = [
  "type",
  "artist_id",
  "title",
  "venue",
  "city",
  "start_date",
  "end_date",
  "ticket_open_at",
  "presale_open_at",
  "price_info",
  "status",
  "image_url",
  "setlist",
  "show_times",
] as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  const lineupRaw = (body as { lineup?: unknown }).lineup;
  const lineup: string[] | null = Array.isArray(lineupRaw)
    ? (lineupRaw as unknown[]).filter((v): v is string => typeof v === "string" && v.length > 0)
    : null;

  // 화이트리스트로 update 페이로드 구성
  const update: Record<string, unknown> = {};
  for (const k of EDITABLE_FIELDS) {
    if (k in body) {
      const v = (body as Record<string, unknown>)[k];
      if (KST_TIMESTAMP_FIELDS.has(k)) {
        update[k] = typeof v === "string" && v.length > 0 ? kstNaiveToISO(v) : null;
      } else {
        update[k] = v;
      }
    }
  }

  // type/lineup 일관성 검증 (lineup 제공된 경우만)
  const typeNext = update.type === "festival" ? "festival" : update.type === "solo" ? "solo" : null;
  const artistIdNext =
    update.artist_id === undefined ? undefined : (update.artist_id as string | null);

  if (lineup) {
    if (typeNext === "solo" && artistIdNext) {
      // solo면 lineup은 artist_id 1개로 강제
      // (UI가 보내준 lineup 무시하고 [artist_id]로)
    } else if (typeNext === "festival") {
      if (lineup.length === 0) {
        return NextResponse.json(
          { error: "페스티벌은 라인업에 1명 이상의 아티스트가 필요합니다." },
          { status: 400 }
        );
      }
      if (artistIdNext && !lineup.includes(artistIdNext)) {
        return NextResponse.json(
          { error: "대표 아티스트는 라인업에 포함되어야 합니다." },
          { status: 400 }
        );
      }
    }
  }

  const { data, error } = await supabase
    .from("performances")
    .update(update as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // lineup 동기화 (요청에 포함된 경우만 — 부분 업데이트는 건드리지 않음)
  if (lineup) {
    const finalLineup = data.type === "solo" && data.artist_id ? [data.artist_id] : lineup;

    const lineupDatesRaw = (body as { lineup_dates?: unknown }).lineup_dates;
    const lineupDates =
      lineupDatesRaw && typeof lineupDatesRaw === "object"
        ? (lineupDatesRaw as Record<string, unknown>)
        : {};
    function pickShowDates(aid: string): string[] | null {
      const v = lineupDates[aid];
      if (!Array.isArray(v)) return null;
      const dates = v.filter(
        (d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
      );
      return dates.length > 0 ? dates : null;
    }

    // 기존 다 지우고 다시 인서트 (간단·안전)
    await supabase.from("performance_artists").delete().eq("performance_id", id);
    if (finalLineup.length > 0) {
      const rows = finalLineup.map((aid, i) => ({
        performance_id: id,
        artist_id: aid,
        display_order: i + 1,
        show_dates: pickShowDates(aid),
      }));
      const { error: paErr } = await supabase.from("performance_artists").insert(rows);
      if (paErr) {
        return NextResponse.json(
          { error: `라인업 저장 실패: ${paErr.message}` },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ success: true, performance: data });
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

  const { error } = await supabase.from("performances").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
