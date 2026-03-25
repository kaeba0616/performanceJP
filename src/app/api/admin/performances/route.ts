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

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("performances")
    .select("*, artist:artists(id, name_ko, name_en), source_listings(count)")
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
  const { artist_id, title, venue, city, start_date, end_date, ticket_open_at, presale_open_at, price_info, status, image_url } = body;

  if (!title || !start_date) {
    return NextResponse.json(
      { error: "title and start_date are required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("performances")
    .insert({ artist_id, title, venue, city, start_date, end_date, ticket_open_at, presale_open_at, price_info, status, image_url })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, performance: data });
}
