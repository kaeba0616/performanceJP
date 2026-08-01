"use client";

import { useState } from "react";
import { formatShowTime } from "@/lib/utils/date";
import { type AttendanceStatus } from "@/lib/orgs/types";

export interface MemberRehearsalRow {
  id: string;
  title: string;
  starts_at_local: string;
  location: string | null;
  target_parts: string | null;
  myStatus: AttendanceStatus | null;
}

const OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "going", label: "참석" },
  { value: "maybe", label: "미정" },
  { value: "not", label: "불참" },
];

export function MemberRehearsals({
  initialRows,
}: {
  initialRows: MemberRehearsalRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState("");

  async function setStatus(id: string, status: AttendanceStatus) {
    setError("");
    // 낙관적 업데이트
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, myStatus: status } : r)));
    const res = await fetch(`/api/rehearsals/${id}/attendance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "체크에 실패했습니다.");
      setRows(prev); // 롤백
    }
  }

  if (rows.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-12 text-center">
        <p className="text-on-surface-variant">등록된 연습 일정이 없어요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-error bg-error-container/30 rounded-xl p-3">{error}</div>}
      {rows.map((r) => (
        <div key={r.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4">
          <p className="font-bold text-on-surface">{r.title}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {formatShowTime(r.starts_at_local)}
            {r.location ? ` · ${r.location}` : ""}
            {r.target_parts ? ` · ${r.target_parts}` : ""}
          </p>
          <div className="flex gap-2 mt-3">
            {OPTIONS.map((opt) => {
              const active = r.myStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(r.id, opt.value)}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition ${
                    active
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
