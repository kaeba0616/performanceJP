"use client";

import type { ShowTime } from "@/types";

interface Props {
  value: ShowTime[];
  onChange: (next: ShowTime[]) => void;
}

const inputClass =
  "w-full border border-[#d1d5db] rounded-lg px-3 py-1.5 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 focus:border-[#0058be]";

export function ShowTimesEditor({ value, onChange }: Props) {
  function updateAt(idx: number, datetime: string) {
    onChange(value.map((s, i) => (i === idx ? { datetime } : s)));
  }
  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function moveBy(idx: number, delta: number) {
    const target = idx + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }
  function addRow() {
    onChange([...value, { datetime: "" }]);
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-[#727785]">
          회차가 비어있으면 디테일 페이지에선 시작일~종료일 범위로 표시됩니다.
        </p>
      )}
      {value.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-6 text-xs text-[#727785] tabular-nums text-right">
            {idx + 1}회차
          </span>
          <input
            type="datetime-local"
            value={row.datetime}
            onChange={(e) => updateAt(idx, e.target.value)}
            className={inputClass + " flex-1"}
          />
          <button
            type="button"
            onClick={() => moveBy(idx, -1)}
            disabled={idx === 0}
            className="w-7 h-7 rounded border border-[#d1d5db] text-[#424754] text-xs hover:bg-[#f9fafb] disabled:opacity-30 disabled:cursor-not-allowed"
            title="위로"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveBy(idx, 1)}
            disabled={idx === value.length - 1}
            className="w-7 h-7 rounded border border-[#d1d5db] text-[#424754] text-xs hover:bg-[#f9fafb] disabled:opacity-30 disabled:cursor-not-allowed"
            title="아래로"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => removeAt(idx)}
            className="w-7 h-7 rounded border border-[#fecaca] text-[#da3437] text-xs hover:bg-[#fef2f2]"
            title="삭제"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm font-medium text-[#0058be] hover:text-[#004a9e]"
      >
        + 회차 추가
      </button>
    </div>
  );
}
