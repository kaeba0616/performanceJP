"use client";

/**
 * 페스티벌 라인업 행에서 "이 아티스트가 어느 일자에 출연하는지" 토글로 선택.
 * 비어있으면 (전체 출연) 의미.
 */
interface Props {
  /** 페스티벌 전체 일자 목록 (YYYY-MM-DD), start_date~end_date 범위 derived. */
  allDates: string[];
  /** 현재 선택된 일자들. 비어있거나 null이면 '전체 출연'. */
  value: string[];
  onChange: (next: string[]) => void;
}

function formatPill(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return d;
  return `${Number(m[2])}/${Number(m[3])}`;
}

export function LineupDatePicker({ allDates, value, onChange }: Props) {
  if (allDates.length <= 1) return null;
  function toggle(d: string) {
    if (value.includes(d)) {
      onChange(value.filter((x) => x !== d));
    } else {
      onChange([...value, d].sort());
    }
  }
  const all = value.length === 0;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-[#727785] uppercase tracking-wider">
        {all ? "전체 출연" : "출연일"}
      </span>
      {allDates.map((d) => {
        const active = value.includes(d);
        return (
          <button
            type="button"
            key={d}
            onClick={() => toggle(d)}
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
              active
                ? "bg-[#0058be] text-white border-[#0058be]"
                : "bg-white text-[#424754] border-[#d1d5db] hover:bg-[#f9fafb]"
            }`}
            title={d}
          >
            {formatPill(d)}
          </button>
        );
      })}
      {!all && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-[10px] text-[#727785] hover:text-[#131b2e] underline"
          title="전체 출연으로 되돌리기"
        >
          전체로
        </button>
      )}
    </div>
  );
}

/** YYYY-MM-DD 두 날짜 사이의 모든 일자 배열 (양 끝 포함). */
export function datesBetween(start: string, end: string | null | undefined): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return [];
  const endDate = end && /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : start;
  const result: string[] = [];
  const s = new Date(start + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  if (e < s) return [start];
  const cur = new Date(s);
  while (cur <= e) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    result.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}
