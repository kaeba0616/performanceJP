"use client";

import { useState, useEffect } from "react";

interface SearchResult {
  sourceId: string;
  sourceUrl: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  imageUrl: string | null;
  matchedArtist: { ko: string; en: string; ja: string } | null;
  hasJapanese: boolean;
  imported: boolean;
}

export default function AdminImportPage() {
  const [token, setToken] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "japanese" | "matched">("all");

  useEffect(() => {
    setToken(localStorage.getItem("admin_token"));
  }, []);

  async function handleSearch(pageNum = 1) {
    if (!token) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/import/search?page=${pageNum}&pageSize=40`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("검색 실패");
      const data = await res.json();
      setResults(data.results);
      setTotalCount(data.totalCount);
      setPage(pageNum);
      setSelected(new Set());
    } catch {
      setMessage({ type: "error", text: "데이터를 가져오는데 실패했습니다." });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!token || selected.size === 0) return;
    setImporting(true);
    setMessage(null);

    const items = results
      .filter((r) => selected.has(r.sourceId) && !r.imported)
      .map((r) => ({
        sourceId: r.sourceId,
        sourceUrl: r.sourceUrl,
        title: r.title,
        startDate: r.startDate,
        endDate: r.endDate,
        venue: r.venue,
        imageUrl: r.imageUrl,
      }));

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `${data.imported}건 가져옴, ${data.skipped}건 건너뜀${data.errors?.length ? `, ${data.errors.length}건 오류` : ""}`,
        });
        // Refresh to update imported status
        handleSearch(page);
      } else {
        setMessage({ type: "error", text: data.error || "가져오기 실패" });
      }
    } catch {
      setMessage({ type: "error", text: "가져오기 중 오류가 발생했습니다." });
    } finally {
      setImporting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const filtered = filteredResults.filter((r) => !r.imported);
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.sourceId)));
    }
  }

  const filteredResults = results.filter((r) => {
    if (filter === "japanese") return r.hasJapanese || r.matchedArtist;
    if (filter === "matched") return r.matchedArtist !== null;
    return true;
  });

  const selectableCount = filteredResults.filter((r) => !r.imported).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#131b2e] mb-2">
        데이터 가져오기
      </h1>
      <p className="text-sm text-[#424754] mb-6">
        예스24에서 공연 데이터를 검색하고 선택적으로 가져올 수 있습니다.
      </p>

      {/* Search controls */}
      <div className="bg-white rounded-lg p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-[#424754]">
          <span className="font-medium">소스:</span>
          <span className="bg-[#ff3b30] text-white text-xs font-bold px-2 py-0.5 rounded">
            예스24
          </span>
          <span className="text-[#727785]">(내한공연 카테고리)</span>
        </div>
        <button
          onClick={() => handleSearch(1)}
          disabled={loading}
          className="bg-[#0058be] text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-[#004a9e] transition-colors disabled:opacity-50"
        >
          {loading ? "검색 중..." : "공연 목록 가져오기"}
        </button>
        {totalCount > 0 && (
          <span className="text-sm text-[#424754]">
            총 {totalCount}건
          </span>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-3 mb-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Filter + actions bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filter === "all"
                    ? "bg-[#0058be] text-white"
                    : "bg-white text-[#424754] hover:bg-[#f2f3ff]"
                }`}
              >
                전체 ({results.length})
              </button>
              <button
                onClick={() => setFilter("japanese")}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filter === "japanese"
                    ? "bg-[#0058be] text-white"
                    : "bg-white text-[#424754] hover:bg-[#f2f3ff]"
                }`}
              >
                일본 관련 (
                {results.filter((r) => r.hasJapanese || r.matchedArtist).length}
                )
              </button>
              <button
                onClick={() => setFilter("matched")}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filter === "matched"
                    ? "bg-[#0058be] text-white"
                    : "bg-white text-[#424754] hover:bg-[#f2f3ff]"
                }`}
              >
                아티스트 매칭 (
                {results.filter((r) => r.matchedArtist).length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="text-xs text-[#0058be] hover:underline"
              >
                {selected.size === selectableCount ? "전체 해제" : "전체 선택"}
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="bg-[#0058be] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#004a9e] transition-colors disabled:opacity-50"
              >
                {importing
                  ? "가져오는 중..."
                  : `선택한 ${selected.size}건 가져오기`}
              </button>
            </div>
          </div>

          {/* Result cards */}
          <div className="space-y-3">
            {filteredResults.map((r) => (
              <div
                key={r.sourceId}
                className={`bg-white rounded-lg p-4 flex items-start gap-4 transition-colors ${
                  r.imported ? "opacity-60" : ""
                } ${selected.has(r.sourceId) ? "ring-2 ring-[#0058be]/30" : ""}`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(r.sourceId)}
                  onChange={() => toggleSelect(r.sourceId)}
                  disabled={r.imported}
                  className="mt-1 w-4 h-4 rounded border-[#d1d5db] text-[#0058be] focus:ring-[#0058be]/30"
                />

                {/* Image */}
                {r.imageUrl && (
                  <img
                    src={r.imageUrl}
                    alt=""
                    className="w-16 h-20 object-cover rounded shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-bold text-[#131b2e] text-sm leading-tight">
                      {r.title}
                    </h3>
                    {r.imported && (
                      <span className="shrink-0 text-[10px] font-bold bg-[#c2c6d6] text-white px-2 py-0.5 rounded-full">
                        가져옴
                      </span>
                    )}
                    {!r.imported && r.matchedArtist && (
                      <span className="shrink-0 text-[10px] font-bold bg-[#6cf8bb] text-[#00714d] px-2 py-0.5 rounded-full">
                        {r.matchedArtist.ko}
                      </span>
                    )}
                    {!r.imported && !r.matchedArtist && r.hasJapanese && (
                      <span className="shrink-0 text-[10px] font-bold bg-[#2170e4] text-white px-2 py-0.5 rounded-full">
                        일본어 감지
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#424754]">
                    {r.startDate && (
                      <span className="font-medium text-[#0058be]">
                        {r.startDate}
                        {r.endDate ? ` ~ ${r.endDate}` : ""}
                      </span>
                    )}
                    {r.venue && <span>{r.venue}</span>}
                  </div>
                </div>

                {/* Link */}
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-[#727785] hover:text-[#0058be]"
                >
                  원본 →
                </a>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalCount > 40 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handleSearch(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 text-sm rounded bg-white text-[#424754] hover:bg-[#f2f3ff] disabled:opacity-30"
              >
                이전
              </button>
              <span className="text-sm text-[#424754]">
                {page} / {Math.ceil(totalCount / 40)}
              </span>
              <button
                onClick={() => handleSearch(page + 1)}
                disabled={page >= Math.ceil(totalCount / 40) || loading}
                className="px-3 py-1.5 text-sm rounded bg-white text-[#424754] hover:bg-[#f2f3ff] disabled:opacity-30"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
