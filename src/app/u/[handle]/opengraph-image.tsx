import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/server";
import { getStampTitle } from "@/lib/stamps/title";

export const runtime = "edge";
export const alt = "내한공연 스탬프 컬렉션 | THE PULSE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

const PRETENDARD_BLACK_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Black.otf";
const PRETENDARD_BOLD_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf";

async function tryLoadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

interface OgData {
  handle: string;
  displayName: string;
  count: number;
  firstYear: string | null;
  topArtists: string[];
}

async function loadOgData(handleParam: string): Promise<OgData | null> {
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, is_public")
    .ilike("handle", handleParam)
    .maybeSingle();
  if (!profile || !profile.is_public || !profile.handle) return null;

  const { data: stamps, count } = await supabase
    .from("user_attendances")
    .select(
      "performance:performances(start_date, artist:artists!performances_artist_id_fkey(id, name_ko, name_en))",
      { count: "exact" }
    )
    .eq("user_id", profile.id);

  type Row = {
    performance: {
      start_date: string;
      artist: { id: string; name_ko: string; name_en: string | null } | null;
    } | null;
  };
  const rows = (stamps ?? []) as unknown as Row[];

  const artistCounts = new Map<string, { name: string; count: number }>();
  let earliest: string | null = null;
  for (const r of rows) {
    const a = r.performance?.artist;
    const d = r.performance?.start_date;
    if (a) {
      const cur = artistCounts.get(a.id);
      const display = a.name_en || a.name_ko;
      if (cur) cur.count += 1;
      else artistCounts.set(a.id, { name: display, count: 1 });
    }
    if (d && (!earliest || d < earliest)) earliest = d;
  }
  const topArtists = Array.from(artistCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((a) => a.name);

  return {
    handle: profile.handle,
    displayName: profile.display_name || `@${profile.handle}`,
    count: count ?? 0,
    firstYear: earliest ? earliest.slice(0, 4) : null,
    topArtists,
  };
}

interface OgPageProps {
  params: Promise<{ handle: string }>;
}

export default async function og({ params }: OgPageProps) {
  const { handle } = await params;
  const data = await loadOgData(handle);

  const [blackFont, boldFont] = await Promise.all([
    tryLoadFont(PRETENDARD_BLACK_URL),
    tryLoadFont(PRETENDARD_BOLD_URL),
  ]);

  const fonts = [
    blackFont && {
      name: "Pretendard",
      data: blackFont,
      weight: 900 as const,
      style: "normal" as const,
    },
    boldFont && {
      name: "Pretendard",
      data: boldFont,
      weight: 700 as const,
      style: "normal" as const,
    },
  ].filter(Boolean) as Array<{
    name: string;
    data: ArrayBuffer;
    weight: 700 | 900;
    style: "normal";
  }>;

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#004191",
            color: "#faf8ff",
            fontSize: 60,
            fontWeight: 900,
          }}
        >
          THE PULSE
        </div>
      ),
      { ...size, fonts: fonts.length ? fonts : undefined }
    );
  }

  const title = getStampTitle(data.count);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #004191 0%, #0058be 50%, #155e4f 100%)",
          color: "#faf8ff",
          padding: "64px 80px",
          fontFamily: "Pretendard, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: 6,
              color: "#adc6ff",
            }}
          >
            THE PULSE
          </div>
          <div style={{ fontSize: 22, opacity: 0.7 }}>jpop.ernebi.org</div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 700, opacity: 0.85 }}>
            @{data.handle}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 24,
              marginTop: 8,
              fontWeight: 900,
              letterSpacing: -4,
            }}
          >
            <span style={{ fontSize: 220, lineHeight: 1, fontStyle: "italic" }}>
              {data.count}
            </span>
            <span style={{ fontSize: 80, lineHeight: 1, color: "#adc6ff" }}>
              {data.count === 1 ? "STAMP" : "STAMPS"}
            </span>
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              marginTop: 16,
              color: "#d8e2ff",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 56 }}>{title.emoji}</span>
            <span>{title.title}</span>
          </div>
          {data.topArtists.length > 0 && (
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                marginTop: 28,
                opacity: 0.85,
              }}
            >
              {data.topArtists.join("  ·  ")}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            opacity: 0.7,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            {data.firstYear ? `${data.firstYear}년부터 함께` : "공연 직관 컬렉션"}
          </span>
          <span>내한공연 스탬프</span>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
