import { kstNaiveToISO } from "@/lib/utils/date";

export interface SubmissionInput {
  submitter_email: string;
  submitter_name?: string | null;
  submitter_note?: string | null;
  artist_id?: string | null;
  proposed_artist_name_ko?: string | null;
  proposed_artist_name_ja?: string | null;
  proposed_artist_name_en?: string | null;
  title: string;
  venue?: string | null;
  city?: string | null;
  start_date: string;
  end_date?: string | null;
  ticket_open_at?: string | null;
  presale_open_at?: string | null;
  price_info?: string | null;
  image_url?: string | null;
  source_url?: string | null;
  website?: string | null; // honeypot
}

export type ValidateResult =
  | { ok: true; data: SubmissionInput; isHoneypot: boolean }
  | { ok: false; error: string; field?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function toOptStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export function validateSubmissionInput(body: unknown): ValidateResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  }
  const raw = body as Record<string, unknown>;

  const submitter_email = toStr(raw.submitter_email).toLowerCase();
  if (!submitter_email || !EMAIL_RE.test(submitter_email)) {
    return {
      ok: false,
      error: "유효한 이메일 주소를 입력해주세요.",
      field: "submitter_email",
    };
  }

  const title = toStr(raw.title);
  if (!title) {
    return { ok: false, error: "공연 제목은 필수입니다.", field: "title" };
  }
  if (title.length > 200) {
    return { ok: false, error: "제목이 너무 깁니다.", field: "title" };
  }

  const start_date = toStr(raw.start_date);
  if (!start_date || !DATE_RE.test(start_date)) {
    return {
      ok: false,
      error: "공연 시작일을 YYYY-MM-DD 형식으로 입력해주세요.",
      field: "start_date",
    };
  }

  const artist_id = toOptStr(raw.artist_id);
  const proposed_artist_name_ko = toOptStr(raw.proposed_artist_name_ko);

  if (artist_id && !UUID_RE.test(artist_id)) {
    return {
      ok: false,
      error: "아티스트 ID 형식이 올바르지 않습니다.",
      field: "artist_id",
    };
  }

  if (!artist_id && !proposed_artist_name_ko) {
    return {
      ok: false,
      error:
        "아티스트를 선택하거나 새 아티스트 이름(한글)을 입력해주세요.",
      field: "artist_id",
    };
  }

  const end_date = toOptStr(raw.end_date);
  if (end_date && !DATE_RE.test(end_date)) {
    return { ok: false, error: "종료일 형식이 올바르지 않습니다.", field: "end_date" };
  }

  const website = typeof raw.website === "string" ? raw.website : "";
  const isHoneypot = website.trim().length > 0;

  const data: SubmissionInput = {
    submitter_email,
    submitter_name: toOptStr(raw.submitter_name),
    submitter_note: toOptStr(raw.submitter_note),
    artist_id,
    proposed_artist_name_ko,
    proposed_artist_name_ja: toOptStr(raw.proposed_artist_name_ja),
    proposed_artist_name_en: toOptStr(raw.proposed_artist_name_en),
    title,
    venue: toOptStr(raw.venue),
    city: toOptStr(raw.city) || "서울",
    start_date,
    end_date,
    ticket_open_at: (() => {
      const s = toOptStr(raw.ticket_open_at);
      return s ? kstNaiveToISO(s) : null;
    })(),
    presale_open_at: (() => {
      const s = toOptStr(raw.presale_open_at);
      return s ? kstNaiveToISO(s) : null;
    })(),
    price_info: toOptStr(raw.price_info),
    image_url: toOptStr(raw.image_url),
    source_url: toOptStr(raw.source_url),
  };

  return { ok: true, data, isHoneypot };
}

export function artistLabel(s: {
  artist?: { name_ko: string; name_en: string | null } | null;
  proposed_artist_name_ko: string | null;
  proposed_artist_name_en: string | null;
}): string {
  if (s.artist) return s.artist.name_en || s.artist.name_ko;
  return s.proposed_artist_name_en || s.proposed_artist_name_ko || "미지정";
}

export function inferSourceFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("yes24.com")) return "yes24";
  if (lower.includes("interpark")) return "interpark";
  if (lower.includes("melon")) return "melon";
  if (lower.includes("ticketlink")) return "ticketlink";
  return "other";
}
