// org 공연 홍보 콘텐츠(gallery/cast_members) jsonb 정규화. PRD F7.

export interface GalleryItem {
  url: string;
  caption: string;
}

export interface CastMember {
  name: string;
  role: string;
  photo_url: string;
  bio: string;
}

export function normalizeGallery(value: unknown): GalleryItem[] {
  if (!Array.isArray(value)) return [];
  const out: GalleryItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const url = typeof raw.url === "string" ? raw.url.trim() : "";
    if (!url) continue;
    out.push({
      url,
      caption: typeof raw.caption === "string" ? raw.caption.trim() : "",
    });
  }
  return out;
}

export function normalizeCast(value: unknown): CastMember[] {
  if (!Array.isArray(value)) return [];
  const out: CastMember[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) continue;
    out.push({
      name,
      role: typeof raw.role === "string" ? raw.role.trim() : "",
      photo_url: typeof raw.photo_url === "string" ? raw.photo_url.trim() : "",
      bio: typeof raw.bio === "string" ? raw.bio.trim() : "",
    });
  }
  return out;
}

/** YouTube URL → 임베드 URL (변환 실패 시 null). */
export function youtubeEmbedUrl(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let id = "";
  try {
    const u = new URL(s);
    const host = u.host.toLowerCase();
    if (host === "youtu.be" || host === "www.youtu.be") {
      id = u.pathname.replace(/^\/+/, "").split("/")[0] ?? "";
    } else if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
      else {
        const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
        if (m) id = m[1];
      }
    }
  } catch {
    return null;
  }
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
