import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Find performances with ticket_open_at in next 48 hours
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: performances } = await supabase
    .from("performances")
    .select("id, ticket_open_at, status")
    .gte("ticket_open_at", now.toISOString())
    .lte("ticket_open_at", in48Hours.toISOString())
    .eq("status", "upcoming");

  if (!performances || performances.length === 0) {
    return NextResponse.json({ success: true, updated: 0 });
  }

  // Update status for performances whose ticket has opened
  let updated = 0;
  for (const perf of performances) {
    if (perf.ticket_open_at && new Date(perf.ticket_open_at) <= now) {
      await supabase
        .from("performances")
        .update({ status: "on_sale", updated_at: now.toISOString() })
        .eq("id", perf.id);
      updated++;
    }
  }

  return NextResponse.json({ success: true, checked: performances.length, updated });
}
