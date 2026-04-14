"use client";

import type { Song } from "@/types";

interface SongEditorProps {
  value: Song[];
  onChange: (next: Song[]) => void;
  label?: string;
  titlePlaceholder?: string;
}

const inputClass =
  "w-full border border-[#d1d5db] rounded-lg px-3 py-1.5 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 focus:border-[#0058be]";

export function SongEditor({
  value,
  onChange,
  label,
  titlePlaceholder = "곡 제목",
}: SongEditorProps) {
  function updateAt(index: number, patch: Partial<Song>) {
    const next = value.map((song, i) =>
      i === index ? { ...song, ...patch } : song
    );
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveBy(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addRow() {
    onChange([...value, { title: "", youtube_url: null }]);
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-semibold text-[#424754]">{label}</div>
      )}
      {value.length === 0 && (
        <p className="text-xs text-[#727785]">등록된 곡이 없습니다.</p>
      )}
      {value.map((song, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <span className="pt-1.5 w-5 text-xs text-[#727785] tabular-nums text-right">
            {idx + 1}
          </span>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="text"
              value={song.title}
              onChange={(e) => updateAt(idx, { title: e.target.value })}
              className={`${inputClass} sm:col-span-2`}
              placeholder={titlePlaceholder}
            />
            <input
              type="url"
              value={song.youtube_url ?? ""}
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
