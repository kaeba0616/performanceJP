import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type SubmissionUpdate = Database["public"]["Tables"]["submissions"]["Update"];

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*, artist:artists!submissions_artist_id_fkey(id, name_ko, name_en)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ submission: data });
}

const EDITABLE_FIELDS = [
  "artist_id",
  "proposed_artist_name_ko",
  "proposed_artist_name_ja",
  "proposed_artist_name_en",
  "title",
  "venue",
  "city",
  "start_date",
  "end_date",
  "ticket_open_at",
  "presale_open_at",
  "price_info",
  "image_url",
  "source_url",
  "admin_note",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const update: SubmissionUpdate = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) {
      const v = body[key];
      const normalized = typeof v === "string" && v.trim() === "" ? null : v;
      (update as Record<string, unknown>)[key] = normalized;
    }
  }

  const supabase = createServiceClient();

  // Prevent editing already-reviewed submissions
  const { data: existing } = await supabase
    .from("submissions")
    .select("status")
    .eq("id", id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: "검토가 완료된 제보는 수정할 수 없습니다." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("submissions")
    .update(update)
    .eq("id", id)
    .select("*, artist:artists!submissions_artist_id_fkey(id, name_ko, name_en)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ submission: data });
}
