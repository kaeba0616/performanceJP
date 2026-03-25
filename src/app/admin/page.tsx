"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface PerformanceRow {
  id: string;
  title: string;
  start_date: string;
  status: string;
  artist: { id: string; name_ko: string; name_en: string | null } | null;
}

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState({ performances: 0, artists: 0, sourceListings: 0 });
  const [recentPerformances, setRecentPerformances] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem("admin_token"));
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const [perfRes, artistRes] = await Promise.all([
        fetch("/api/admin/performances", { headers }),
        fetch("/api/admin/artists", { headers }),
      ]);

      if (perfRes.ok) {
        const perfData = await perfRes.json();
        const performances = perfData.performances || [];
        const totalLinks = performances.reduce(
          (acc: number, p: { source_listings: { count: number }[] }) =>
            acc + (p.source_listings?.[0]?.count || 0),
          0
        );
        setStats((prev) => ({
          ...prev,
          performances: performances.length,
          sourceListings: totalLinks,
        }));
        setRecentPerformances(performances.slice(0, 5));
      }

      if (artistRes.ok) {
        const artistData = await artistRes.json();
        setStats((prev) => ({ ...prev, artists: (artistData.artists || []).length }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const statCards = [
    { label: "공연", value: stats.performances, unit: "건", color: "text-[#0058be]" },
    { label: "아티스트", value: stats.artists, unit: "명", color: "text-[#7c3aed]" },
    { label: "티켓링크", value: stats.sourceListings, unit: "건", color: "text-[#059669]" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#131b2e] mb-6">대시보드</h1>

      {loading ? (
        <div className="text-[#424754]">로딩 중...</div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-lg p-5 shadow-sm border border-[#e5e7eb]">
                <p className="text-sm text-[#424754] mb-1">{card.label}</p>
                <p className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                  <span className="text-base font-normal text-[#424754] ml-1">{card.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-3 mb-8">
            <Link
              href="/admin/performances/new"
              className="inline-flex items-center gap-2 bg-[#0058be] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#004a9e] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              공연 추가
            </Link>
            <Link
              href="/admin/artists"
              className="inline-flex items-center gap-2 bg-white text-[#131b2e] border border-[#d1d5db] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#f9fafb] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              아티스트 추가
            </Link>
          </div>

          {/* Recent performances */}
          <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb]">
            <div className="px-5 py-4 border-b border-[#e5e7eb]">
              <h2 className="text-base font-semibold text-[#131b2e]">최근 공연</h2>
            </div>
            {recentPerformances.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[#424754]">등록된 공연이 없습니다.</div>
            ) : (
              <ul className="divide-y divide-[#e5e7eb]">
                {recentPerformances.map((perf) => (
                  <li key={perf.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/admin/performances/${perf.id}/edit`}
                        className="text-sm font-medium text-[#131b2e] hover:text-[#0058be]"
                      >
                        {perf.title}
                      </Link>
                      <p className="text-xs text-[#424754] mt-0.5">
                        {perf.artist?.name_ko || "아티스트 미지정"} &middot; {perf.start_date}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[perf.status] || "bg-gray-100 text-gray-500"}`}>
                      {statusLabel[perf.status] || perf.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
