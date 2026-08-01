import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  requirePerfOrgStaff,
  getSessionUser,
  getOrgRole,
} from "@/lib/orgs/permissions";
import { kstNaiveToISO } from "@/lib/utils/date";
import type { Database } from "@/lib/supabase/types";

type PerfUpdate = Database["public"]["Tables"]["performances"]["Update"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("performances")
    .select(
      "*, artist:artists!performances_artist_id_fkey(*), source_listings(*), performance_artists(display_order, artist:artists(*))"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Performance not found" },
      { status: 404 }
    );
  }

  // 비공개(private) org 공연은 소속 멤버에게만 노출
  if (data.visibility === "private") {
    const user = await getSessionUser();
    const role = user && data.org_id ? await getOrgRole(data.org_id, user.id) : null;
    if (!role) {
      return NextResponse.json({ error: "Performance not found" }, { status: 404 });
    }
  }

  return NextResponse.json(data);
}

// null 허용 텍스트 필드 (title은 NOT NULL이라 별도 처리)
const NULLABLE_TEXT_FIELDS = [
  "summary",
  "venue",
  "city",
  "price_info",
  "poster_url",
  "image_url",
  "video_url",
] as const;

const VALID_VISIBILITY = new Set(["public", "unlisted", "private"]);

// jsonb 배열 정규화 — 허용 키만 남기고 문자열화
function cleanArray(
  value: unknown,
  keys: string[]
): Array<Record<string, string>> | null {
  if (!Array.isArray(value)) return null;
  const out: Array<Record<string, string>> = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const obj: Record<string, string> = {};
    let hasContent = false;
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === "string" && v.trim()) {
        obj[k] = v.trim();
        hasContent = true;
      }
    }
    if (hasContent) out.push(obj);
  }
  return out;
}

// PATCH /api/performances/:id — org 공연 수정/발행. 소유 org의 staff만.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requirePerfOrgStaff(id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const patch: PerfUpdate = {};

  for (const f of NULLABLE_TEXT_FIELDS) {
    if (f in body) {
      const v = body[f];
      patch[f] = typeof v === "string" && v.trim() ? v.trim() : null;
    }
  }

  if ("title" in body) {
    const v = body.title;
    const title = typeof v === "string" ? v.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "공연 제목은 비울 수 없습니다.", field: "title" }, { status: 400 });
    }
    patch.title = title;
  }

  if ("start_date" in body) {
    const v = String(body.start_date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return NextResponse.json({ error: "공연 날짜 형식이 올바르지 않습니다." }, { status: 400 });
    }
    patch.start_date = v;
  }
  if ("end_date" in body) {
    const v = String(body.end_date ?? "").trim();
    patch.end_date = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  }
  if ("ticket_open_at" in body) {
    const v = body.ticket_open_at;
    patch.ticket_open_at =
      typeof v === "string" && v.trim() ? kstNaiveToISO(v.trim()) : null;
  }
  if ("gallery" in body) {
    const arr = cleanArray(body.gallery, ["url", "caption"]);
    patch.gallery = arr && arr.length > 0 ? arr : null;
  }
  if ("cast_members" in body) {
    const arr = cleanArray(body.cast_members, ["name", "role", "photo_url", "bio"]);
    patch.cast_members = arr && arr.length > 0 ? arr : null;
  }
  if ("visibility" in body) {
    const v = String(body.visibility ?? "");
    if (!VALID_VISIBILITY.has(v)) {
      return NextResponse.json({ error: "잘못된 공개 설정입니다." }, { status: 400 });
    }
    patch.visibility = v as PerfUpdate["visibility"];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc.from("performances").update(patch).eq("id", id);
  if (error) {
    console.error("Failed to update org performance", error);
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/performances/:id — org 공연 삭제. 소유 org의 staff만.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requirePerfOrgStaff(id);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const svc = createServiceClient();
  const { error } = await svc.from("performances").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
