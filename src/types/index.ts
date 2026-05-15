export interface Song {
  title: string;
  youtube_url: string | null;
}

function normalizeYouTubeUrl(raw: string): string {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }
  const host = parsed.host.toLowerCase();
  const buildWatch = (id: string, t?: string | null) => {
    const out = new URL("https://www.youtube.com/watch");
    out.searchParams.set("v", id);
    if (t) out.searchParams.set("t", t);
    return out.toString();
  };
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = parsed.pathname.replace(/^\/+/, "").split("/")[0];
    if (id) return buildWatch(id, parsed.searchParams.get("t"));
    return trimmed;
  }
  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      if (id) return buildWatch(id, parsed.searchParams.get("t"));
    }
    const shorts = parsed.pathname.match(/^\/shorts\/([^/]+)/);
    if (shorts) return buildWatch(shorts[1], parsed.searchParams.get("t"));
  }
  return trimmed;
}

export function normalizeSongs(value: unknown): Song[] {
  if (!Array.isArray(value)) return [];
  const out: Song[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!title) continue;
    const urlRaw =
      typeof raw.youtube_url === "string" && raw.youtube_url.trim()
        ? raw.youtube_url.trim()
        : null;
    const url = urlRaw ? normalizeYouTubeUrl(urlRaw) : null;
    out.push({ title, youtube_url: url });
  }
  return out;
}

export interface Artist {
  id: string;
  name_ko: string;
  name_ja: string | null;
  name_en: string | null;
  image_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  x_url: string | null;
  hit_songs: unknown;
  created_at: string;
}

export type PerformanceType = "solo" | "festival";

export interface Performance {
  id: string;
  artist_id: string | null;
  type: PerformanceType;
  title: string;
  venue: string | null;
  city: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  ticket_open_at: string | null;
  presale_open_at: string | null;
  price_info: string | null;
  status: string;
  image_url: string | null;
  setlist: unknown;
  show_times: unknown;
  created_at: string;
  updated_at: string;
  artist?: Artist | null;
}

export interface ShowTime {
  datetime: string; // "YYYY-MM-DDTHH:mm" (KST 로컬, TZ 없음)
}

/** show_times jsonb를 안전하게 정규화. 잘못된 항목은 버림. */
export function normalizeShowTimes(value: unknown): ShowTime[] {
  if (!Array.isArray(value)) return [];
  const out: ShowTime[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const dt = typeof raw.datetime === "string" ? raw.datetime.trim() : "";
    // "YYYY-MM-DDTHH:mm" 형식만 통과
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dt)) continue;
    out.push({ datetime: dt.slice(0, 16) });
  }
  return out;
}

// 라인업 한 줄 (junction + artist 조인 결과)
export interface PerformanceArtist {
  artist_id: string;
  display_order: number;
  artist: Artist;
}

export interface SourceListing {
  id: string;
  performance_id: string | null;
  source: string;
  source_url: string;
  source_id: string | null;
  raw_title: string;
  raw_data: Record<string, unknown>;
  ticket_open_at: string | null;
  price_info: string | null;
  last_crawled_at: string;
  created_at: string;
}

export interface PerformanceWithDetails extends Performance {
  artist: Artist | null;
  source_listings: SourceListing[];
  performance_artists?: PerformanceArtist[];
}

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Submission {
  id: string;
  submitter_email: string;
  submitter_name: string | null;
  submitter_ip: string | null;
  submitter_note: string | null;
  artist_id: string | null;
  proposed_artist_name_ko: string | null;
  proposed_artist_name_ja: string | null;
  proposed_artist_name_en: string | null;
  title: string;
  venue: string | null;
  city: string | null;
  start_date: string;
  end_date: string | null;
  ticket_open_at: string | null;
  presale_open_at: string | null;
  price_info: string | null;
  image_url: string | null;
  source_url: string | null;
  status: SubmissionStatus;
  admin_note: string | null;
  rejection_reason: string | null;
  approved_performance_id: string | null;
  created_artist_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  artist?: Pick<Artist, "id" | "name_ko" | "name_en"> | null;
}
