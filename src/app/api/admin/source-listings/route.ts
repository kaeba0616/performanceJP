import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

const VALID_SOURCES = ["yes24", "interpark", "melon"] as const;

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { performance_id, source, source_url, raw_title, source_id, ticket_open_at, price_info } = body;

  if (!performance_id || !source || !source_url || !raw_title) {
    return NextResponse.json(
      { error: "performance_id, source, source_url, and raw_title are required" },
      { status: 400 }
    );
  }

  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `source must be one of: ${VALID_SOURCES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("source_listings")
    .insert({ performance_id, source, source_url, raw_title, source_id, ticket_open_at, price_info })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, source_listing: data });
}
