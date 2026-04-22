"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Mail,
  MapPin,
  CalendarDays,
  Ticket,
  Music2,
  Link as LinkIcon,
  Sparkles,
  Send,
} from "lucide-react";

interface ArtistOption {
  id: string;
  name_ko: string;
  name_en: string | null;
}

const NEW_ARTIST = "__new__";

export default function SubmitPage() {
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterName, setSubmitterName] = useState("");

  const [artistSelect, setArtistSelect] = useState("");
  const [newArtistKo, setNewArtistKo] = useState("");
  const [newArtistJa, setNewArtistJa] = useState("");
  const [newArtistEn, setNewArtistEn] = useState("");

  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("서울");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ticketOpenAt, setTicketOpenAt] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/artists");
        if (res.ok) {
          const data = await res.json();
          setArtists(
            (data.artists || []).map((a: ArtistOption) => ({
              id: a.id,
              name_ko: a.name_ko,
              name_en: a.name_en,
            }))
          );
        }
      } catch {
        // ignore
      } finally {
        setLoadingArtists(false);
      }
    })();
  }, []);

  const isNewArtist = artistSelect === NEW_ARTIST;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isNewArtist && !artistSelect) {
      setError("아티스트를 선택하거나 '찾는 아티스트가 없어요'를 선택해주세요.");
      return;
    }
    if (isNewArtist && !newArtistKo.trim()) {
      setError("새 아티스트 이름(한글)을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitter_email: submitterEmail,
          submitter_name: submitterName || null,
          submitter_note: note || null,
          artist_id: isNewArtist ? null : artistSelect,
          proposed_artist_name_ko: isNewArtist ? newArtistKo : null,
          proposed_artist_name_ja: isNewArtist ? newArtistJa || null : null,
          proposed_artist_name_en: isNewArtist ? newArtistEn || null : null,
          title,
          venue: venue || null,
          city: city || null,
          start_date: startDate,
          end_date: endDate || null,
          ticket_open_at: ticketOpenAt || null,
          price_info: priceInfo || null,
          source_url: sourceUrl || null,
          website,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data?.error || "제보 요청에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
        <div className="bg-surface-container-lowest rounded-3xl p-10 md:p-14 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8" strokeWidth={3} />
          </div>
          <h1 className="editorial-title text-3xl md:text-4xl font-black text-on-surface mb-3">
            제보 접수 완료
          </h1>
          <p className="text-on-surface-variant font-medium">
            <strong className="text-on-surface">{submitterEmail}</strong>로 접수
            확인 메일을 보냈습니다.
            <br />
            관리자 검토 후 1~3일 내에 등록 여부를 알려드립니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-12 pb-24">
      <div className="mb-10">
        <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">
          Help us track the scene
        </p>
        <h1 className="editorial-title text-4xl md:text-5xl font-black text-on-surface mb-3">
          🎤 공연 제보
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant font-medium">
          알고 계신 J-POP / J-ROCK 내한공연 정보를 알려주세요. 관리자 검토 후
          등록됩니다.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
            style={{ position: "absolute", left: "-9999px" }}
          />

          {/* Email */}
          <Field
            label="이메일 주소"
            hint="결과 안내용으로만 사용됩니다."
            required
          >
            <InputWithIcon icon={<Mail className="w-4 h-4" />}>
              <input
                type="email"
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={inputBase}
              />
            </InputWithIcon>
          </Field>

          <Field label="이름(선택)">
            <input
              type="text"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="표시하지 않습니다"
              className={inputBase}
            />
          </Field>

          {/* Artist */}
          <Field label="아티스트" required>
            <InputWithIcon icon={<Music2 className="w-4 h-4" />}>
              <select
                value={artistSelect}
                onChange={(e) => setArtistSelect(e.target.value)}
                className={`${inputBase} appearance-none`}
                required
              >
                <option value="">
                  {loadingArtists ? "불러오는 중..." : "아티스트 선택"}
                </option>
                <option value={NEW_ARTIST}>
                  ✨ 찾는 아티스트가 없어요
                </option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name_ko}
                    {a.name_en ? ` · ${a.name_en}` : ""}
                  </option>
                ))}
              </select>
            </InputWithIcon>
          </Field>

          {isNewArtist && (
            <div className="bg-primary-fixed/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                새 아티스트 제안
              </div>
              <Field label="한글 이름" required>
                <input
                  type="text"
                  value={newArtistKo}
                  onChange={(e) => setNewArtistKo(e.target.value)}
                  placeholder="예: 요아소비"
                  className={inputBase}
                  required={isNewArtist}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="일본어 이름">
                  <input
                    type="text"
                    value={newArtistJa}
                    onChange={(e) => setNewArtistJa(e.target.value)}
                    placeholder="예: YOASOBI"
                    className={inputBase}
                  />
                </Field>
                <Field label="영문 이름">
                  <input
                    type="text"
                    value={newArtistEn}
                    onChange={(e) => setNewArtistEn(e.target.value)}
                    placeholder="예: YOASOBI"
                    className={inputBase}
                  />
                </Field>
              </div>
            </div>
          )}

          <Field label="공연 제목" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="예: YOASOBI ASIA TOUR in Seoul"
              className={inputBase}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="공연장">
              <InputWithIcon icon={<MapPin className="w-4 h-4" />}>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="예: KSPO DOME"
                  className={inputBase}
                />
              </InputWithIcon>
            </Field>
            <Field label="도시">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="서울"
                className={inputBase}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="시작일" required>
              <InputWithIcon icon={<CalendarDays className="w-4 h-4" />}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className={inputBase}
                />
              </InputWithIcon>
            </Field>
            <Field label="종료일(선택)">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputBase}
              />
            </Field>
          </div>

          <Field label="티켓 오픈 일시">
            <InputWithIcon icon={<Ticket className="w-4 h-4" />}>
              <input
                type="datetime-local"
                value={ticketOpenAt}
                onChange={(e) => setTicketOpenAt(e.target.value)}
                className={inputBase}
              />
            </InputWithIcon>
          </Field>

          <Field label="가격 정보">
            <input
              type="text"
              value={priceInfo}
              onChange={(e) => setPriceInfo(e.target.value)}
              placeholder="예: R석 165,000원 / S석 132,000원"
              className={inputBase}
            />
          </Field>

          <Field
            label="참고 URL"
            hint="공식 공지, 예매처 링크 등 — 선택"
          >
            <InputWithIcon icon={<LinkIcon className="w-4 h-4" />}>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className={inputBase}
              />
            </InputWithIcon>
          </Field>

          <Field label="비고(선택)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="추가로 공유할 내용이 있다면 자유롭게 적어주세요."
              rows={3}
              className={`${inputBase} min-h-[96px] resize-y`}
            />
          </Field>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-on-primary font-black text-sm bg-gradient-to-br from-primary to-primary-container hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? "제출 중..." : "제보 보내기"}
          </button>

          <p className="text-xs text-on-surface-variant/70 text-center">
            제출하신 정보는 관리자 검토 후 사이트에 공개됩니다. 이메일은 결과
            안내 이외의 목적으로 사용되지 않습니다.
          </p>
        </form>
      </div>
    </div>
  );
}

const inputBase =
  "w-full bg-surface-container-low rounded-xl pl-4 pr-4 py-3.5 text-base text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-on-surface-variant/70 mt-1.5">{hint}</p>
      )}
    </div>
  );
}

function InputWithIcon({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
        {icon}
      </div>
      <div className="[&>input]:pl-11 [&>select]:pl-11">{children}</div>
    </div>
  );
}
