import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const supabase = createServerClient();
  let query = supabase
    .from("submissions")
    .select(
      "*, artist:artists!submissions_artist_id_fkey(id, name_ko, name_en)"
    )
    .order("created_at", { ascending: false });

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Counts per status for badge display
  const { data: counts } = await supabase
    .from("submissions")
    .select("status");
  const countByStatus = { pending: 0, approved: 0, rejected: 0 } as Record<
    string,
    number
  >;
  for (const row of counts || []) {
    if (row.status in countByStatus) countByStatus[row.status]++;
  }

  return NextResponse.json({ submissions: data, counts: countByStatus });
}
