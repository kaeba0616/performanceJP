import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendTicketOpenReminder } from "@/lib/notifications/sender";

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
  const now = new Date();
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

  // Find performances with ticket opening in the next hour
  const { data: performances } = await supabase
    .from("performances")
    .select(`
      id,
      title,
      ticket_open_at,
      artist:artists(id, name_ko),
      source_listings(source, source_url)
    `)
    .gte("ticket_open_at", now.toISOString())
    .lte("ticket_open_at", in1Hour.toISOString())
    .eq("status", "upcoming");

  if (!performances || performances.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  let sent = 0;

  for (const perf of performances) {
    // Find subscribers who want ticket open notifications
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select(`
        subscriber:subscribers(id, email, verified, unsubscribe_token)
      `)
      .eq("notify_ticket_open", true)
      .or(
        `type.eq.all,and(type.eq.artist,target_id.eq.${perf.artist?.id}),and(type.eq.performance,target_id.eq.${perf.id})`
      );

    if (!subscriptions) continue;

    for (const sub of subscriptions) {
      const subscriber = sub.subscriber as unknown as {
        id: string;
        email: string;
        verified: boolean;
        unsubscribe_token: string;
      };
      if (!subscriber?.verified) continue;

      // Check if already notified
      const { data: existing } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("subscriber_id", subscriber.id)
        .eq("performance_id", perf.id)
        .eq("type", "ticket_open_reminder")
        .single();

      if (existing) continue;

      // Send notification
      const sourceLinks = (
        perf.source_listings as unknown as { source: string; source_url: string }[]
      ).map((sl) => ({
        source: sl.source,
        url: sl.source_url,
      }));

      try {
        await sendTicketOpenReminder({
          to: subscriber.email,
          artistName: (perf.artist as unknown as { name_ko: string })?.name_ko || "",
          performanceTitle: perf.title,
          ticketOpenAt: perf.ticket_open_at!,
          sourceLinks,
          unsubscribeToken: subscriber.unsubscribe_token,
        });

        // Log notification
        await supabase.from("notifications_log").insert({
          subscriber_id: subscriber.id,
          performance_id: perf.id,
          type: "ticket_open_reminder",
        });

        sent++;
      } catch (err) {
        console.error(`Failed to send to ${subscriber.email}:`, err);
      }
    }
  }

  return NextResponse.json({ success: true, sent });
}
