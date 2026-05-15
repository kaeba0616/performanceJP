"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Artist } from "@/types";

interface Item {
  artist: Artist;
}

interface Props {
  items: Item[];
  /** 이 개수 초과면 더보기/닫기 토글 노출. 기본 6 */
  collapseThreshold?: number;
}

export function LineupGrid({ items, collapseThreshold = 6 }: Props) {
  const [open, setOpen] = useState(false);
  const total = items.length;
  const shouldCollapse = total > collapseThreshold;
  const visible = !shouldCollapse || open ? items : items.slice(0, collapseThreshold);

  return (
    <>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map(({ artist }) => (
          <li key={artist.id}>
            <Link
              href={`/artists/${artist.id}`}
              className="flex items-center gap-3 bg-surface-container-low rounded-xl p-3 hover:bg-surface-container transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                {artist.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={artist.image_url}
                    alt={artist.name_ko}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-primary/50">
                    {artist.name_ko.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-on-surface truncate">
                  {artist.name_ko}
                </p>
                {artist.name_en && (
                  <p className="text-xs text-on-surface-variant truncate">
                    {artist.name_en}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          {open ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              닫기
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              더보기 (총 {total}명)
            </>
          )}
        </button>
      )}
    </>
  );
}
