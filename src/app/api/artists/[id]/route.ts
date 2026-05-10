import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: artist, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !artist) {
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }

  // junction을 통해 이 아티스트가 출연한 모든 공연(단독 + 페스티벌) 수집
  const { data: junctionRows } = await supabase
    .from("performance_artists")
    .select("performance_id")
    .eq("artist_id", id);

  const perfIds = junctionRows?.map((r) => r.performance_id) ?? [];

  const { data: performances } =
    perfIds.length > 0
      ? await supabase
          .from("performances")
          .select("*")
          .in("id", perfIds)
          .order("start_date", { ascending: true })
      : { data: [] };

  return NextResponse.json({ artist, performances: performances || [] });
}
