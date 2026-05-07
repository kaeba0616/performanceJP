"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type FilterStatus = "pending" | "approved" | "rejected" | "all";

interface SubmissionRow {
  id: string;
  title: string;
  start_date: string;
  venue: string | null;
  status: string;
  submitter_email: string;
  created_at: string;
  proposed_artist_name_ko: string | null;
  proposed_artist_name_en: string | null;
  artist: { id: string; name_ko: string; name_en: string | null } | null;
}

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
  { value: "all", label: "전체" },
];

export default function AdminSubmissionsPage() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(
        `/api/admin/submissions?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setRows(data.submissions || []);
        setCounts(data.counts || {});
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  }

  function artistLabel(row: SubmissionRow) {
    if (row.artist) return row.artist.name_en || row.artist.name_ko;
    return (
      row.proposed_artist_name_en ||
      row.proposed_artist_name_ko ||
      "미지정"
    );
  }

  const statusBadge: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const statusLabel: Record<string, string> = {
    pending: "대기",
    approved: "승인",
    rejected: "거절",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#131b2e]">공연 제보</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? (counts.pending || 0) +
                (counts.approved || 0) +
                (counts.rejected || 0)
              : counts[f.value] || 0;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#0058be] text-white"
                  : "bg-white text-[#424754] border border-[#d1d5db] hover:bg-[#f9fafb]"
              }`}
            >
              {f.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-[#f3f4f6] text-[#424754]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb]">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-[#424754]">
            로딩 중...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#424754]">
            해당 상태의 제보가 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e7eb]">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/submissions/${row.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#f9fafb] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          statusBadge[row.status] ||
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {statusLabel[row.status] || row.status}
                      </span>
                      <span className="text-xs text-[#424754]">
                        {formatDateTime(row.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#131b2e] truncate">
                      {row.title}
                    </p>
                    <p className="text-xs text-[#424754] mt-0.5 truncate">
                      {artistLabel(row)} · {row.start_date}
                      {row.venue ? ` · ${row.venue}` : ""} · {row.submitter_email}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-[#9ca3af] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
