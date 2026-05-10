import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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

  return NextResponse.json(data);
}
