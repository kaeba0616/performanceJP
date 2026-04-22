import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { inferSourceFromUrl } from "@/lib/submissions/validate";
import { sendSubmissionApproved } from "@/lib/notifications/sender";

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    artist_id?: string | null;
    createNewArtist?: boolean;
  };

  const supabase = createServerClient();

  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (submission.status !== "pending") {
    return NextResponse.json(
      { error: "이미 검토가 완료된 제보입니다." },
      { status: 400 }
    );
  }

  // 1. Resolve artist
  let artistId: string | null = null;
  let createdArtistId: string | null = null;

  if (body.createNewArtist) {
    const name_ko =
      submission.proposed_artist_name_ko?.trim() ||
      submission.proposed_artist_name_en?.trim();
    if (!name_ko) {
      return NextResponse.json(
        { error: "새 아티스트를 생성하려면 한글 이름이 필요합니다." },
        { status: 400 }
      );
    }
    const { data: newArtist, error: artErr } = await supabase
      .from("artists")
      .insert({
        name_ko,
        name_ja: submission.proposed_artist_name_ja,
        name_en: submission.proposed_artist_name_en,
      })
      .select("id")
      .single();
    if (artErr || !newArtist) {
      console.error("Failed to create artist", artErr);
      return NextResponse.json(
        { error: "아티스트 생성에 실패했습니다." },
        { status: 500 }
      );
    }
    artistId = newArtist.id;
    createdArtistId = newArtist.id;
  } else if (body.artist_id) {
    artistId = body.artist_id;
  } else if (submission.artist_id) {
    artistId = submission.artist_id;
  } else {
    return NextResponse.json(
      {
        error:
          "아티스트를 선택하거나 '새 아티스트 생성'을 체크해주세요.",
      },
      { status: 400 }
    );
  }

  // 2. Insert performance
  const { data: perf, error: perfErr } = await supabase
    .from("performances")
    .insert({
      artist_id: artistId,
      title: submission.title,
      venue: submission.venue,
      city: submission.city,
      start_date: submission.start_date,
      end_date: submission.end_date,
      ticket_open_at: submission.ticket_open_at,
      presale_open_at: submission.presale_open_at,
      price_info: submission.price_info,
      image_url: submission.image_url,
      status: "upcoming",
    })
    .select("id")
    .single();

  if (perfErr || !perf) {
    console.error("Failed to create performance", perfErr);
    return NextResponse.json(
      { error: "공연 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  // 3. Source listing (best effort)
  if (submission.source_url) {
    const source = inferSourceFromUrl(submission.source_url);
    await supabase.from("source_listings").insert({
      performance_id: perf.id,
      source,
      source_url: submission.source_url,
      raw_title: submission.title,
    });
  }

  // 4. Mark submission as approved
  const { error: updateErr } = await supabase
    .from("submissions")
    .update({
      status: "approved",
      approved_performance_id: perf.id,
      created_artist_id: createdArtistId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    console.error("Failed to update submission status", updateErr);
  }

  // 5. Notify submitter
  await sendSubmissionApproved({
    to: submission.submitter_email,
    title: submission.title,
    performanceId: perf.id,
  });

  return NextResponse.json({
    ok: true,
    performanceId: perf.id,
    createdArtistId,
  });
}
