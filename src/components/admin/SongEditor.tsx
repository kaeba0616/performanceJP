"use client";

import { useState } from "react";
import type { Song } from "@/types";

interface SongEditorProps {
  value: Song[];
  onChange: (next: Song[]) => void;
  label?: string;
  titlePlaceholder?: string;
}

interface Row {
  id: string;
  song: Song;
}

const inputClass =
  "w-full border border-[#d1d5db] rounded-lg px-3 py-1.5 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 focus:border-[#0058be]";

function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function rowsFromValue(value: Song[], prev: Row[] = []): Row[] {
  return value.map((song, i) => {
    const existing = prev[i];
    if (
      existing &&
      existing.song.title === song.title &&
      existing.song.youtube_url === song.youtube_url
    ) {
      return existing;
    }
    return { id: uid(), song };
  });
}

function sameContent(rows: Row[], value: Song[]): boolean {
  if (rows.length !== value.length) return false;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].song.title !== value[i].title) return false;
    if (rows[i].song.youtube_url !== value[i].youtube_url) return false;
  }
  return true;
}

export function SongEditor({
  value,
  onChange,
  label,
  titlePlaceholder = "곡 제목",
}: SongEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => rowsFromValue(value));
  const [prevValue, setPrevValue] = useState(value);

  // 부모가 value를 외부에서 교체했을 때(예: 서버에서 다시 로드)
  // 로컬 rows를 동기화. setState during render 패턴 — useEffect 대신.
  if (value !== prevValue) {
    setPrevValue(value);
    if (!sameContent(rows, value)) {
      setRows(rowsFromValue(value, rows));
    }
  }

  function commit(next: Row[]) {
    setRows(next);
    onChange(next.map((r) => r.song));
  }

  function updateAt(index: number, patch: Partial<Song>) {
    commit(
      rows.map((r, i) =>
        i === index ? { id: r.id, song: { ...r.song, ...patch } } : r
      )
    );
  }

  function removeAt(index: number) {
    commit(rows.filter((_, i) => i !== index));
  }

  function moveBy(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  function addRow() {
    commit([...rows, { id: uid(), song: { title: "", youtube_url: null } }]);
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-semibold text-[#424754]">{label}</div>
      )}
      {rows.length === 0 && (
        <p className="text-xs text-[#727785]">등록된 곡이 없습니다.</p>
      )}
      {rows.map((row, idx) => (
        <div key={row.id} className="flex items-start gap-2">
          <span className="pt-1.5 w-5 text-xs text-[#727785] tabular-nums text-right">
            {idx + 1}
          </span>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="text"
              value={row.song.title}
              onChange={(e) => updateAt(idx, { title: e.target.value })}
              className={`${inputClass} sm:col-span-2`}
              placeholder={titlePlaceholder}
            />
            <input
              type="url"
              value={row.song.youtube_url ?? ""}
              onChange={(e) =>
                updateAt(idx, { youtube_url: e.target.value || null })
              }
              className={`${inputClass} sm:col-span-3`}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="flex items-center gap-1 pt-0.5">
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
              disabled={idx === rows.length - 1}
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
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm font-medium text-[#0058be] hover:text-[#004a9e]"
      >
        + 곡 추가
      </button>
    </div>
  );
}
