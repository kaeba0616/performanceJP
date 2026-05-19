import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTicketOpenReminder } from "@/lib/notifications/sender";
import {
  loadSubscriptionsForSubscriber,
  sendPushToMany,
  type PushPayload,
} from "@/lib/notifications/push";

// Run every ~5 minutes via external cron (cron-job.org, GitHub Actions,
// or server crontab). Idempotent — safe to call repeatedly.
//
// Auth: Bearer CRON_SECRET (header or query string).
//
// Strategy:
//   1. Find performances whose ticket_open_at is in the next 55–65 minutes
//      (a 10-min window; 5-min cron + a 5-min margin).
//   2. For each matching performance, find subscribers via subscriptions:
//        - type = 'all'                                  (always)
//        - type = 'artist'      AND target_id = artist   (matched)
//        - type = 'performance' AND target_id = perf.id  (matched)
//      …filtered to notify_ticket_open = true, subscriber.verified = true.
//   3. Send email if not already logged in notifications_log.
//   4. For each subscriber's push subscriptions, send push if not already
//      logged in web_push_log.
//
// All sends are recorded by UNIQUE constraints, so double-firing is safe.

export const dynamic = "force-dynamic";

const WINDOW_START_MIN = 55;
const WINDOW_END_MIN = 65;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  // Allow ?key= for cron-job.org style triggers that can't set headers easily.
  const key = new URL(request.url).searchParams.get("key");
  return key === secret;
}

interface PerformanceRow {
  id: string;
  artist_id: string;
  title: string;
  ticket_open_at: string;
  status: string;
  artist: { name_ko: string } | null;
}

interface SourceLinkRow {
  source: string;
  source_url: string;
}

interface SubscriberRow {
  id: string;
  email: string;
  unsubscribe_token: string;
}

interface OutcomePerf {
  performance_id: string;
  title: string;
  email_sent: number;
  email_skipped: number;
  push_sent: number;
  push_skipped: number;
  push_removed: number;
}

export async function POST(request: NextRequest) {
  return run(request);
}

// GET also supported so cron services that only do GET can trigger.
export async function GET(request: NextRequest) {
  return run(request);
}

async function run(request: NextRequest): Promise<NextResponse> {
  if (!checkAuth(request)) return unauthorized();
  const supabase = createServiceClient();

  const now = new Date();
  const windowStart = new Date(now.getTime() + WINDOW_START_MIN * 60_000);
  const windowEnd = new Date(now.getTime() + WINDOW_END_MIN * 60_000);

  const { data: perfs, error: perfErr } = await supabase
    .from("performances")
    .select(
      "id, artist_id, title, ticket_open_at, status, artist:artists!performances_artist_id_fkey(name_ko)",
    )
    .gte("ticket_open_at", windowStart.toISOString())
    .lt("ticket_open_at", windowEnd.toISOString())
    .not("status", "in", "(cancelled,completed)");

  if (perfErr) {
    console.error("[cron:ticket-open] performance query failed", perfErr);
    return NextResponse.json({ error: perfErr.message }, { status: 500 });
  }

  const performances = (perfs || []) as unknown as PerformanceRow[];
  if (performances.length === 0) {
    return NextResponse.json({
      ok: true,
      window: [windowStart.toISOString(), windowEnd.toISOString()],
      matched: 0,
    });
  }

  const outcomes: OutcomePerf[] = [];

  for (const perf of performances) {
    const outcome: OutcomePerf = {
      performance_id: perf.id,
      title: perf.title,
      email_sent: 0,
      email_skipped: 0,
      push_sent: 0,
      push_skipped: 0,
      push_removed: 0,
    };

    // Source links for the email body
    const { data: sources } = await supabase
      .from("source_listings")
      .select("source, source_url")
      .eq("performance_id", perf.id);
    const sourceLinks = ((sources || []) as SourceLinkRow[]).map((s) => ({
      source: s.source,
      url: s.source_url,
    }));

    // Find subscribers: all + artist + performance
    const { data: matchedSubs } = await supabase
      .from("subscriptions")
      .select("subscriber_id, type, target_id")
      .eq("notify_ticket_open", true)
      .or(
        [
          `type.eq.all`,
          `and(type.eq.artist,target_id.eq.${perf.artist_id})`,
          `and(type.eq.performance,target_id.eq.${perf.id})`,
        ].join(","),
      );

    const subscriberIds = Array.from(
      new Set((matchedSubs || []).map((s) => s.subscriber_id)),
    );
    if (subscriberIds.length === 0) {
      outcomes.push(outcome);
      continue;
    }

    const { data: subscribers } = await supabase
      .from("subscribers")
      .select("id, email, unsubscribe_token")
      .in("id", subscriberIds)
      .eq("verified", true);

    const verifiedSubs = (subscribers || []) as SubscriberRow[];

    for (const sub of verifiedSubs) {
      // Email — guard via notifications_log UNIQUE (subscriber_id, performance_id, type)
      const { data: existingEmailLog } = await supabase
        .from("notifications_log")
        .select("id")
        .eq("subscriber_id", sub.id)
        .eq("performance_id", perf.id)
        .eq("type", "ticket_open_reminder")
        .maybeSingle();

      if (existingEmailLog) {
        outcome.email_skipped++;
      } else {
        try {
          await sendTicketOpenReminder({
            to: sub.email,
            artistName: perf.artist?.name_ko || "아티스트",
            performanceTitle: perf.title,
            ticketOpenAt: perf.ticket_open_at,
            sourceLinks,
            unsubscribeToken: sub.unsubscribe_token,
          });
          await supabase.from("notifications_log").insert({
            subscriber_id: sub.id,
            performance_id: perf.id,
            type: "ticket_open_reminder",
          });
          outcome.email_sent++;
        } catch (err) {
          console.error(
            `[cron:ticket-open] email failed for ${sub.email}`,
            err,
          );
        }
      }

      // Push — load this subscriber's push subscriptions
      const pushTargets = await loadSubscriptionsForSubscriber(sub.id);
      if (pushTargets.length === 0) continue;

      const payload: PushPayload = {
        title: `🎟 ${perf.artist?.name_ko || "공연"} 티켓 오픈 1시간 전`,
        body: perf.title,
        url: `/performances/${perf.id}`,
        tag: `ticket-open-${perf.id}`,
        icon: "/icons/icon-192.png",
      };

      // Filter out ones we've already sent push for this performance.
      const targetIds = pushTargets.map((t) => t.id);
      const { data: pushLogs } = await supabase
        .from("web_push_log")
        .select("web_push_subscription_id")
        .eq("performance_id", perf.id)
        .eq("type", "ticket_open_reminder")
        .in("web_push_subscription_id", targetIds);

      const alreadyLogged = new Set(
        (pushLogs || []).map((l) => l.web_push_subscription_id),
      );
      const toSend = pushTargets.filter((t) => !alreadyLogged.has(t.id));
      outcome.push_skipped += pushTargets.length - toSend.length;
      if (toSend.length === 0) continue;

      const results = await sendPushToMany(toSend, payload);
      const logRows = results
        .filter((r) => r.ok)
        .map((r) => ({
          web_push_subscription_id: r.id,
          performance_id: perf.id,
          type: "ticket_open_reminder" as const,
        }));
      if (logRows.length > 0) {
        await supabase.from("web_push_log").insert(logRows);
      }
      outcome.push_sent += results.filter((r) => r.ok).length;
      outcome.push_removed += results.filter((r) => r.removed).length;
    }

    outcomes.push(outcome);
  }

  return NextResponse.json({
    ok: true,
    window: [windowStart.toISOString(), windowEnd.toISOString()],
    matched: performances.length,
    outcomes,
  });
}
