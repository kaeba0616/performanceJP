import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name_ko, name_ja, name_en } = body;

  if (!name_ko) {
    return NextResponse.json(
      { error: "name_ko is required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("artists")
    .insert({ name_ko, name_ja, name_en })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, artist: data });
}
