export interface Song {
  title: string;
  youtube_url: string | null;
}

export function normalizeSongs(value: unknown): Song[] {
  if (!Array.isArray(value)) return [];
  const out: Song[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!title) continue;
    const url =
      typeof raw.youtube_url === "string" && raw.youtube_url.trim()
        ? raw.youtube_url.trim()
        : null;
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

export interface Performance {
  id: string;
  artist_id: string | null;
  title: string;
  venue: string | null;
  city: string | null;
  start_date: string;
  end_date: string | null;
  ticket_open_at: string | null;
  presale_open_at: string | null;
  price_info: string | null;
  status: string;
  image_url: string | null;
  setlist: unknown;
  created_at: string;
  updated_at: string;
  artist?: Artist | null;
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
}
