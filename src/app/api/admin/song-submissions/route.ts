import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

import { verifyAdminRequest as verifyAdmin } from "@/lib/admin/auth";

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const kind = url.searchParams.get("kind");

  const supabase = createServiceClient();
  let query = supabase
    .from("song_submissions")
    .select(
      "*, performance:performances!song_submissions_performance_id_fkey(id, title, start_date, venue), artist:artists!song_submissions_artist_id_fkey(id, name_ko, name_en)"
    )
    .order("created_at", { ascending: false });

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query = query.eq("status", status);
  }
  if (kind === "setlist" || kind === "hit_songs") {
    query = query.eq("kind", kind);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: counts } = await supabase.from("song_submissions").select("status");
  const countByStatus = { pending: 0, approved: 0, rejected: 0 } as Record<string, number>;
  for (const row of counts || []) {
    if (row.status in countByStatus) countByStatus[row.status]++;
  }

  return NextResponse.json({ submissions: data, counts: countByStatus });
}
