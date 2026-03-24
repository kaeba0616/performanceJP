import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: artist, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !artist) {
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }

  const { data: performances } = await supabase
    .from("performances")
    .select("*")
    .eq("artist_id", id)
    .order("start_date", { ascending: true });

  return NextResponse.json({ artist, performances: performances || [] });
}
