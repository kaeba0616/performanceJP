import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // e.g., "2026-04"
  const status = searchParams.get("status");
  const artistId = searchParams.get("artist_id");

  let query = supabase
    .from("performances")
    .select("*, artist:artists(*)")
    .order("start_date", { ascending: true });

  if (month) {
    const [year, m] = month.split("-").map(Number);
    const startOfMonth = `${year}-${String(m).padStart(2, "0")}-01`;
    const endOfMonth = new Date(year, m, 0).toISOString().split("T")[0];
    query = query.gte("start_date", startOfMonth).lte("start_date", endOfMonth);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (artistId) {
    query = query.eq("artist_id", artistId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ performances: data });
}
