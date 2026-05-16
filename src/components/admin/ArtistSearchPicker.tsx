"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface PickableArtist {
  id: string;
  name_ko: string;
  name_en: string | null;
  name_ja?: string | null;
  image_url?: string | null;
}

interface Props {
  artists: PickableArtist[];
  excludeIds?: string[];
  onPick: (artist: PickableArtist) => void;
  placeholder?: string;
  inputClass: string;
  maxResults?: number;
}

export function ArtistSearchPicker({
  artists,
  excludeIds = [],
  onPick,
  placeholder = "아티스트 검색",
  inputClass,
  maxResults = 20,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = artists.filter((a) => !excludeSet.has(a.id));
    if (!q) return filtered.slice(0, maxResults);
    return filtered
      .filter((a) => {
        if (a.name_ko.toLowerCase().includes(q)) return true;
        if (a.name_en && a.name_en.toLowerCase().includes(q)) return true;
        if (a.name_ja && a.name_ja.toLowerCase().includes(q)) return true;
        return false;
      })
      .slice(0, maxResults);
  }, [artists, excludeSet, query, maxResults]);

  useEffect(() => {
    if (!isOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  function handlePick(artist: PickableArtist) {
    onPick(artist);
    setQuery("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (matches.length > 0) handlePick(matches[0]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClass}
      />
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#d1d5db] rounded-lg shadow-lg max-h-60 overflow-auto">
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#727785]">
              {query.trim() ? "검색 결과 없음" : "추가 가능한 아티스트가 없습니다"}
            </div>
          ) : (
            <ul>
              {matches.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePick(a)}
                    className="w-full px-3 py-2 text-sm text-left text-[#131b2e] hover:bg-[#f9fafb] flex items-center gap-2"
                  >
                    {a.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={a.image_url}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="h-6 w-6 rounded-full bg-[#e5e7eb] flex-shrink-0" />
                    )}
                    <span className="flex-1">
                      {a.name_ko}
                      {a.name_en ? ` (${a.name_en})` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
