"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SongEditor } from "@/components/admin/SongEditor";
import { ShowTimesEditor } from "@/components/admin/ShowTimesEditor";
import type { ShowTime, Song } from "@/types";

interface ArtistOption {
  id: string;
  name_ko: string;
  name_en: string | null;
}

interface SourceLinkRow {
  source: string;
  source_url: string;
  raw_title: string;
}

export default function NewPerformancePage() {
  const router = useRouter();
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Inline new-artist form
  const [showNewArtist, setShowNewArtist] = useState(false);
  const [creatingArtist, setCreatingArtist] = useState(false);
  const [newArtistError, setNewArtistError] = useState("");
  const [newArtist, setNewArtist] = useState({ name_ko: "", name_en: "", name_ja: "", image_url: "" });

  // Form state
  const [perfType, setPerfType] = useState<"solo" | "festival">("solo");
  const [artistId, setArtistId] = useState("");
  const [lineup, setLineup] = useState<string[]>([]); // 페스티벌 라인업 (artist_id 순서대로)
  const [primaryArtistId, setPrimaryArtistId] = useState<string>(""); // 페스티벌 대표 아티스트 (없음=빈값)
  const [pickArtistId, setPickArtistId] = useState(""); // 라인업 추가용 임시 select 값
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("서울");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [ticketOpenAt, setTicketOpenAt] = useState("");
  const [presaleOpenAt, setPresaleOpenAt] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [imageUrl, setImageUrl] = useState("");
  const [showTimes, setShowTimes] = useState<ShowTime[]>([]);
  const [setlist, setSetlist] = useState<Song[]>([]);

  // Source links
  const [sourceLinks, setSourceLinks] = useState<SourceLinkRow[]>([]);
  const fetchArtists = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/artists", {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setArtists(data.artists || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  function addSourceLink() {
    setSourceLinks((prev) => [...prev, { source: "yes24", source_url: "", raw_title: title }]);
  }

  async function handleCreateArtist() {
    const ko = newArtist.name_ko.trim();
    if (!ko) {
      setNewArtistError("한국어 이름은 필수입니다.");
      return;
    }
    setCreatingArtist(true);
    setNewArtistError("");
    try {
      const res = await fetch("/api/admin/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_ko: ko,
          name_en: newArtist.name_en.trim() || null,
          name_ja: newArtist.name_ja.trim() || null,
          image_url: newArtist.image_url.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewArtistError(data.error || "아티스트 추가 실패");
        return;
      }
      const created = data.artist as ArtistOption;
      setArtists((prev) => [...prev, created].sort((a, b) => a.name_ko.localeCompare(b.name_ko)));
      // 모드에 따라 자동 반영
      if (perfType === "solo") {
        setArtistId(created.id);
      } else {
        setLineup((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
      }
      setNewArtist({ name_ko: "", name_en: "", name_ja: "", image_url: "" });
      setShowNewArtist(false);
    } catch {
      setNewArtistError("네트워크 오류");
    } finally {
      setCreatingArtist(false);
    }
  }

  function addToLineup(id: string) {
    if (!id) return;
    setLineup((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPickArtistId("");
  }

  function removeFromLineup(id: string) {
    setLineup((prev) => prev.filter((x) => x !== id));
    if (primaryArtistId === id) setPrimaryArtistId("");
  }

  function moveLineup(idx: number, delta: number) {
    setLineup((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function artistLabel(id: string): string {
    const a = artists.find((x) => x.id === id);
    if (!a) return id;
    return `${a.name_ko}${a.name_en ? ` (${a.name_en})` : ""}`;
  }

  function updateSourceLink(index: number, field: keyof SourceLinkRow, value: string) {
    setSourceLinks((prev) => prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  }

  function removeSourceLink(index: number) {
    setSourceLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      setError("제목과 시작일은 필수입니다.");
      return;
    }

    // 모드별 검증
    if (perfType === "solo" && !artistId) {
      setError("단독 공연은 아티스트를 선택해주세요.");
      return;
    }
    if (perfType === "festival" && lineup.length === 0) {
      setError("페스티벌은 라인업에 1명 이상의 아티스트를 추가해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const headers = { "Content-Type": "application/json" };

      const cleanedSetlist = setlist
        .map((s) => ({
          title: s.title.trim(),
          youtube_url: s.youtube_url?.trim() || null,
        }))
        .filter((s) => s.title.length > 0);

      const payloadArtistId =
        perfType === "solo" ? artistId : primaryArtistId || null;
      const payloadLineup =
        perfType === "solo" ? [artistId] : lineup;

      // Create performance
      const perfRes = await fetch("/api/admin/performances", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: perfType,
          artist_id: payloadArtistId,
          lineup: payloadLineup,
          title: title.trim(),
          venue: venue.trim() || null,
          city: city.trim() || null,
          start_date: startDate,
          end_date: endDate || null,
          start_time: startTime || null,
          end_time: endTime || null,
          ticket_open_at: ticketOpenAt || null,
          presale_open_at: presaleOpenAt || null,
          price_info: priceInfo.trim() || null,
          status,
          image_url: imageUrl.trim() || null,
          show_times: showTimes
            .map((s) => ({ datetime: s.datetime.trim() }))
            .filter((s) => s.datetime.length > 0),
          setlist: cleanedSetlist.length ? cleanedSetlist : null,
        }),
      });

      if (!perfRes.ok) {
        const errData = await perfRes.json();
        setError(errData.error || "공연 생성 실패");
        setSubmitting(false);
        return;
      }

      const perfData = await perfRes.json();
      const performanceId = perfData.performance.id;

      // 티켓 링크들을 병렬로 생성하면서 실패 행을 수집
      const linkResults = await Promise.all(
        sourceLinks
          .filter((l) => l.source_url.trim())
          .map(async (link) => {
            try {
              const res = await fetch("/api/admin/source-listings", {
                method: "POST",
                headers,
                body: JSON.stringify({
                  performance_id: performanceId,
                  source: link.source,
                  source_url: link.source_url.trim(),
                  raw_title: link.raw_title.trim() || title.trim(),
                }),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return {
                  ok: false as const,
                  link,
                  message: err.error || `HTTP ${res.status}`,
                };
              }
              return { ok: true as const, link };
            } catch {
              return { ok: false as const, link, message: "네트워크 오류" };
            }
          })
      );

      const failed = linkResults.filter((r) => !r.ok);
      if (failed.length > 0) {
        const summary = failed
          .map((f) => `• ${f.link.source} ${f.link.source_url}: ${f.message}`)
          .join("\n");
        setError(
          `공연은 저장됐지만 ${failed.length}개 티켓 링크 추가 실패:\n${summary}\n` +
            `편집 페이지에서 다시 추가해주세요.`
        );
        // 실패가 있어도 perf는 만들어졌으니 편집 페이지로 보냄
        router.push(`/admin/performances/${performanceId}/edit`);
        return;
      }

      router.push("/admin/performances");
    } catch {
      setError("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 focus:border-[#0058be]";
  const labelClass = "block text-sm font-medium text-[#424754] mb-1";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#131b2e] mb-6">공연 추가</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-6 space-y-4">
          {/* 공연 종류 */}
          <div>
            <label className={labelClass}>공연 종류</label>
            <div className="flex gap-3">
              <label className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm ${perfType === "solo" ? "border-[#0058be] bg-[#0058be]/5 text-[#0058be] font-medium" : "border-[#d1d5db] text-[#424754]"}`}>
                <input
                  type="radio"
                  name="perfType"
                  value="solo"
                  checked={perfType === "solo"}
                  onChange={() => setPerfType("solo")}
                  className="mr-2"
                />
                단독 공연 (1명)
              </label>
              <label className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm ${perfType === "festival" ? "border-[#0058be] bg-[#0058be]/5 text-[#0058be] font-medium" : "border-[#d1d5db] text-[#424754]"}`}>
                <input
                  type="radio"
                  name="perfType"
                  value="festival"
                  checked={perfType === "festival"}
                  onChange={() => setPerfType("festival")}
                  className="mr-2"
                />
                페스티벌 (다수)
              </label>
            </div>
          </div>

          {/* Artist (solo) / Lineup (festival) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass + " mb-0"}>
                {perfType === "solo" ? (
                  <>아티스트 <span className="text-[#da3437]">*</span></>
                ) : (
                  <>라인업 <span className="text-[#da3437]">*</span></>
                )}
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowNewArtist((v) => !v);
                  setNewArtistError("");
                }}
                className="text-xs font-medium text-[#0058be] hover:text-[#004a9e]"
              >
                {showNewArtist ? "취소" : "+ 새 아티스트"}
              </button>
            </div>

            {/* solo: 단일 select */}
            {perfType === "solo" && (
              <select
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                className={inputClass}
              >
                <option value="">선택하세요</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name_ko}{a.name_en ? ` (${a.name_en})` : ""}
                  </option>
                ))}
              </select>
            )}

            {/* festival: 라인업 픽커 */}
            {perfType === "festival" && (
              <div className="space-y-2">
                {/* 라인업 목록 */}
                {lineup.length === 0 ? (
                  <p className="text-xs text-[#727785] py-1">아직 라인업이 없습니다.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {lineup.map((aid, idx) => (
                      <li key={aid} className="flex items-center gap-2 bg-[#f9fafb] rounded-lg px-3 py-2 border border-[#e5e7eb]">
                        <span className="w-5 text-xs text-[#727785] tabular-nums text-right">{idx + 1}</span>
                        <span className="flex-1 text-sm text-[#131b2e]">{artistLabel(aid)}</span>
                        <button
                          type="button"
                          onClick={() => moveLineup(idx, -1)}
                          disabled={idx === 0}
                          className="w-7 h-7 rounded border border-[#d1d5db] text-[#424754] text-xs hover:bg-white disabled:opacity-30"
                          title="위로"
                        >↑</button>
                        <button
                          type="button"
                          onClick={() => moveLineup(idx, 1)}
                          disabled={idx === lineup.length - 1}
                          className="w-7 h-7 rounded border border-[#d1d5db] text-[#424754] text-xs hover:bg-white disabled:opacity-30"
                          title="아래로"
                        >↓</button>
                        <button
                          type="button"
                          onClick={() => removeFromLineup(aid)}
                          className="w-7 h-7 rounded border border-[#fecaca] text-[#da3437] text-xs hover:bg-[#fef2f2]"
                          title="제거"
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
                {/* 기존 아티스트에서 추가 */}
                <div className="flex gap-2">
                  <select
                    value={pickArtistId}
                    onChange={(e) => setPickArtistId(e.target.value)}
                    className={inputClass + " flex-1"}
                  >
                    <option value="">기존 아티스트에서 추가</option>
                    {artists
                      .filter((a) => !lineup.includes(a.id))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name_ko}{a.name_en ? ` (${a.name_en})` : ""}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => addToLineup(pickArtistId)}
                    disabled={!pickArtistId}
                    className="bg-[#0058be] text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-[#004a9e] disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>

                {/* 대표 아티스트 (선택) */}
                {lineup.length > 1 && (
                  <div className="pt-2">
                    <label className="block text-xs text-[#424754] mb-1">
                      대표 아티스트 (선택) — 카드/리스트에 표시될 헤드라이너
                    </label>
                    <select
                      value={primaryArtistId}
                      onChange={(e) => setPrimaryArtistId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">없음 (페스티벌 제목만 표시)</option>
                      {lineup.map((aid) => (
                        <option key={aid} value={aid}>
                          {artistLabel(aid)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 새 아티스트 인라인 폼 (양쪽 모드 공통) */}
            {showNewArtist && (
              <div className="mt-3 p-3 bg-[#f9fafb] rounded-lg border border-[#e5e7eb] space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-[#424754] mb-0.5">
                      한국어 <span className="text-[#da3437]">*</span>
                    </label>
                    <input
                      type="text"
                      value={newArtist.name_ko}
                      onChange={(e) => setNewArtist((f) => ({ ...f, name_ko: e.target.value }))}
                      className={inputClass}
                      placeholder="요아소비"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#424754] mb-0.5">English</label>
                    <input
                      type="text"
                      value={newArtist.name_en}
                      onChange={(e) => setNewArtist((f) => ({ ...f, name_en: e.target.value }))}
                      className={inputClass}
                      placeholder="YOASOBI"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#424754] mb-0.5">日本語</label>
                    <input
                      type="text"
                      value={newArtist.name_ja}
                      onChange={(e) => setNewArtist((f) => ({ ...f, name_ja: e.target.value }))}
                      className={inputClass}
                      placeholder="ヨアソビ"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#424754] mb-0.5">이미지 URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={newArtist.image_url}
                      onChange={(e) => setNewArtist((f) => ({ ...f, image_url: e.target.value }))}
                      className={inputClass}
                      placeholder="https://..."
                    />
                    {newArtist.image_url.trim() && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={newArtist.image_url.trim()}
                        alt="미리보기"
                        className="h-10 w-10 rounded object-cover border border-[#e5e7eb] flex-shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </div>
                {newArtistError && (
                  <p className="text-xs text-[#da3437]">{newArtistError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateArtist}
                    disabled={creatingArtist}
                    className="bg-[#0058be] text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[#004a9e] transition-colors disabled:opacity-60"
                  >
                    {creatingArtist
                      ? "추가 중..."
                      : perfType === "solo"
                        ? "아티스트 추가하고 선택"
                        : "아티스트 추가하고 라인업에 넣기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewArtist(false);
                      setNewArtist({ name_ko: "", name_en: "", name_ja: "", image_url: "" });
                      setNewArtistError("");
                    }}
                    className="bg-white text-[#424754] border border-[#d1d5db] rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[#f9fafb] transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>
              제목 <span className="text-[#da3437]">*</span>
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
          </div>

          {/* Venue & City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>장소</label>
              <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>도시</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Dates + times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                시작일 <span className="text-[#da3437]">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass + " flex-1"}
                  required
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass + " w-28"}
                  title="시작 시간 (선택)"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>종료일</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass + " flex-1"}
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass + " w-28"}
                  title="종료 시간 (선택)"
                />
              </div>
            </div>
          </div>

          {/* Ticket open dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>티켓 오픈</label>
              <input type="datetime-local" value={ticketOpenAt} onChange={(e) => setTicketOpenAt(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>선예매 오픈</label>
              <input type="datetime-local" value={presaleOpenAt} onChange={(e) => setPresaleOpenAt(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Price info */}
          <div>
            <label className={labelClass}>가격 정보</label>
            <input type="text" value={priceInfo} onChange={(e) => setPriceInfo(e.target.value)} className={inputClass} placeholder="예: R석 165,000원 / S석 132,000원" />
          </div>

          {/* Status */}
          <div>
            <label className={labelClass}>상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="upcoming">예정</option>
              <option value="on_sale">판매중</option>
              <option value="sold_out">매진</option>
              <option value="completed">종료</option>
            </select>
          </div>

          {/* Show times */}
          <div>
            <label className={labelClass}>회차 (날짜 + 시작 시간)</label>
            <ShowTimesEditor value={showTimes} onChange={setShowTimes} />
          </div>

          {/* Image URL */}
          <div>
            <label className={labelClass}>이미지 URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputClass}
              placeholder="https://... (비워두면 아티스트 이미지로 폴백)"
            />
            {imageUrl.trim() && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl.trim()}
                  alt="미리보기"
                  className="h-32 w-32 rounded-lg object-cover border border-[#e5e7eb]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Setlist */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-6">
          <h2 className="text-base font-semibold text-[#131b2e] mb-4">셋리스트</h2>
          <SongEditor value={setlist} onChange={setSetlist} />
        </div>

        {/* Source links section */}
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#131b2e]">티켓 링크 추가</h2>
            <button
              type="button"
              onClick={addSourceLink}
              className="inline-flex items-center gap-1 text-sm text-[#0058be] hover:text-[#004a9e] font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              링크 추가
            </button>
          </div>

          {sourceLinks.length === 0 ? (
            <p className="text-sm text-[#424754]">추가된 링크가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {sourceLinks.map((link, index) => (
                <div key={index} className="flex gap-3 items-start p-3 bg-[#f9fafb] rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-[#424754] mb-0.5">소스</label>
                        <select
                          value={link.source}
                          onChange={(e) => updateSourceLink(index, "source", e.target.value)}
                          className={inputClass}
                        >
                          <option value="yes24">YES24</option>
                          <option value="interpark">인터파크</option>
                          <option value="melon">멜론티켓</option>
                          <option value="ticketlink">티켓링크</option>
                          <option value="other">기타</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-[#424754] mb-0.5">URL</label>
                        <input
                          type="url"
                          value={link.source_url}
                          onChange={(e) => updateSourceLink(index, "source_url", e.target.value)}
                          className={inputClass}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#424754] mb-0.5">제목</label>
                      <input
                        type="text"
                        value={link.raw_title}
                        onChange={(e) => updateSourceLink(index, "raw_title", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSourceLink(index)}
                    className="mt-5 p-1 text-[#da3437] hover:text-[#b91c1c]"
                    title="삭제"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-[#da3437] whitespace-pre-line">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#0058be] text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-[#004a9e] transition-colors disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/performances")}
            className="bg-white text-[#424754] border border-[#d1d5db] rounded-lg px-6 py-2 text-sm font-medium hover:bg-[#f9fafb] transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
