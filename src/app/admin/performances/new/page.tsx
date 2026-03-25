"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const [token, setToken] = useState<string | null>(null);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [artistId, setArtistId] = useState("");
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("서울");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ticketOpenAt, setTicketOpenAt] = useState("");
  const [presaleOpenAt, setPresaleOpenAt] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [status, setStatus] = useState("upcoming");

  // Source links
  const [sourceLinks, setSourceLinks] = useState<SourceLinkRow[]>([]);

  useEffect(() => {
    setToken(localStorage.getItem("admin_token"));
  }, []);

  const fetchArtists = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/artists", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setArtists(data.artists || []);
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  function addSourceLink() {
    setSourceLinks((prev) => [...prev, { source: "yes24", source_url: "", raw_title: title }]);
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

    setSubmitting(true);
    setError("");

    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      // Create performance
      const perfRes = await fetch("/api/admin/performances", {
        method: "POST",
        headers,
        body: JSON.stringify({
          artist_id: artistId || null,
          title: title.trim(),
          venue: venue.trim() || null,
          city: city.trim() || null,
          start_date: startDate,
          end_date: endDate || null,
          ticket_open_at: ticketOpenAt || null,
          presale_open_at: presaleOpenAt || null,
          price_info: priceInfo.trim() || null,
          status,
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

      // Create source listings
      for (const link of sourceLinks) {
        if (!link.source_url.trim()) continue;
        await fetch("/api/admin/source-listings", {
          method: "POST",
          headers,
          body: JSON.stringify({
            performance_id: performanceId,
            source: link.source,
            source_url: link.source_url.trim(),
            raw_title: link.raw_title.trim() || title.trim(),
          }),
        });
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
          {/* Artist */}
          <div>
            <label className={labelClass}>아티스트</label>
            <select value={artistId} onChange={(e) => setArtistId(e.target.value)} className={inputClass}>
              <option value="">선택 안함</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name_ko}{a.name_en ? ` (${a.name_en})` : ""}
                </option>
              ))}
            </select>
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                시작일 <span className="text-[#da3437]">*</span>
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>종료일</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
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

        {error && <p className="text-sm text-[#da3437]">{error}</p>}

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
