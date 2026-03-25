export interface Artist {
  id: string;
  name_ko: string;
  name_ja: string | null;
  name_en: string | null;
  image_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  x_url: string | null;
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
