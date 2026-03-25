"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface PerformanceRow {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  venue: string | null;
  status: string;
  artist: { id: string; name_ko: string; name_en: string | null } | null;
  source_listings: { count: number }[];
}

const statusLabel: Record<string, string> = {
  upcoming: "예정",
  on_sale: "판매중",
  sold_out: "매진",
  completed: "종료",
};

const statusColor: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  on_sale: "bg-green-100 text-green-700",
  sold_out: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-500",
};

export default function AdminPerformancesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [performances, setPerformances] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem("admin_token"));
  }, []);

  const fetchPerformances = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/performances", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setPerformances(data.performances || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPerformances();
  }, [fetchPerformances]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`"${title}" 공연을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/performances/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setPerformances((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("삭제 실패");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#131b2e]">공연 관리</h1>
        <Link
          href="/admin/performances/new"
          className="inline-flex items-center gap-2 bg-[#0058be] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#004a9e] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          공연 추가
        </Link>
      </div>

      {loading ? (
        <div className="text-[#424754]">로딩 중...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">제목</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">아티스트</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">날짜</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">장소</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">티켓링크</th>
                  <th className="text-left px-4 py-3 font-medium text-[#424754]">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {performances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#424754]">
                      등록된 공연이 없습니다.
                    </td>
                  </tr>
                ) : (
                  performances.map((perf) => (
                    <tr key={perf.id} className="hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 font-medium text-[#131b2e]">{perf.title}</td>
                      <td className="px-4 py-3 text-[#424754] whitespace-nowrap">{perf.artist?.name_ko || "-"}</td>
                      <td className="px-4 py-3 text-[#424754] whitespace-nowrap">
                        {perf.start_date}
                        {perf.end_date && perf.end_date !== perf.start_date && ` ~ ${perf.end_date}`}
                      </td>
                      <td className="px-4 py-3 text-[#424754] whitespace-nowrap">{perf.venue || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[perf.status] || "bg-gray-100 text-gray-500"}`}>
                          {statusLabel[perf.status] || perf.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#424754] whitespace-nowrap">{perf.source_listings?.[0]?.count || 0}건</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/performances/${perf.id}/edit`}
                            className="text-[#0058be] hover:text-[#004a9e] text-sm font-medium"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => handleDelete(perf.id, perf.title)}
                            className="text-[#da3437] hover:text-[#b91c1c] text-sm font-medium"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
