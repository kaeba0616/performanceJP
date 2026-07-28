"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  RESERVATION_STATUS_LABEL,
  type ReservationStatus,
} from "@/lib/orgs/types";

export interface ReservationRow {
  id: string;
  name: string;
  party_size: number;
  phone: string | null;
  email: string | null;
  status: ReservationStatus;
  note: string | null;
  performanceTitle: string;
  showLabel: string | null;
}

const STATUS_STYLE: Record<ReservationStatus, string> = {
  confirmed: "bg-primary/15 text-primary",
  pending: "bg-secondary/15 text-secondary",
  cancelled: "bg-surface-container-high text-on-surface-variant",
  no_show: "bg-error/15 text-error",
};

export function ReservationsTable({
  orgId,
  initialRows,
}: {
  orgId: string;
  initialRows: ReservationRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState("");

  const activeCount = rows
    .filter((r) => r.status === "confirmed" || r.status === "pending")
    .reduce((sum, r) => sum + r.party_size, 0);

  async function changeStatus(id: string, status: ReservationStatus) {
    setError("");
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "변경 실패");
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-on-surface">예약 ({rows.length})</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            유효 예약 인원 합계 {activeCount}명
          </p>
        </div>
        <a
          href={`/api/orgs/${orgId}/reservations/export`}
          className="inline-flex items-center gap-1.5 bg-surface-container-low text-on-surface font-bold text-sm py-2 px-4 rounded-full hover:bg-surface-container transition"
        >
          <Download className="w-4 h-4" />
          CSV 내보내기
        </a>
      </div>

      {error && (
        <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>
      )}

      {rows.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
          <p className="text-on-surface-variant">아직 예약이 없어요.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-black text-on-surface-variant uppercase tracking-widest border-b border-outline-variant">
                <th className="py-2.5 pr-3">이름</th>
                <th className="py-2.5 px-3">공연/회차</th>
                <th className="py-2.5 px-3">인원</th>
                <th className="py-2.5 px-3">연락처</th>
                <th className="py-2.5 px-3">상태</th>
                <th className="py-2.5 pl-3">변경</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-outline-variant/50">
                  <td className="py-3 pr-3">
                    <p className="font-bold text-on-surface">{r.name}</p>
                    {r.note && (
                      <p className="text-xs text-on-surface-variant">{r.note}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant">
                    <p className="truncate max-w-[180px]">{r.performanceTitle}</p>
                    {r.showLabel && (
                      <p className="text-xs">{r.showLabel}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-on-surface">{r.party_size}</td>
                  <td className="py-3 px-3 text-on-surface-variant">
                    <p>{r.phone ?? "-"}</p>
                    {r.email && <p className="text-xs truncate max-w-[160px]">{r.email}</p>}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-full ${STATUS_STYLE[r.status]}`}
                    >
                      {RESERVATION_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="py-3 pl-3">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        changeStatus(r.id, e.target.value as ReservationStatus)
                      }
                      className="bg-surface-container-low rounded-full px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="confirmed">확정</option>
                      <option value="pending">대기</option>
                      <option value="no_show">노쇼</option>
                      <option value="cancelled">취소</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
