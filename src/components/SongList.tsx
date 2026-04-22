"use client";

import { useState } from "react";
import { Play, ChevronDown, ListMusic } from "lucide-react";
import type { Song } from "@/types";

interface SongListProps {
  songs: Song[];
  title: string;
  emptyLabel?: string;
}

export function SongList({
  songs,
  title,
  emptyLabel = "아직 등록된 곡이 없습니다.",
}: SongListProps) {
  const [open, setOpen] = useState(songs.length > 0);
  const hasSongs = songs.length > 0;

  return (
    <section className="mb-10">
      <button
        type="button"
        onClick={() => hasSongs && setOpen((v) => !v)}
        disabled={!hasSongs}
        aria-expanded={hasSongs ? open : false}
        className={`w-full flex items-center justify-between gap-3 mb-4 rounded-2xl p-4 transition-colors ${
          hasSongs
            ? "bg-surface-container-low hover:bg-primary-fixed cursor-pointer group"
            : "bg-surface-container-low/50 cursor-not-allowed"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasSongs
                ? "bg-primary text-on-primary group-hover:bg-primary-container"
                : "bg-surface-container-high text-on-surface-variant/50"
            }`}
          >
            <ListMusic className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2
              className={`editorial-title-sm text-xl md:text-2xl font-black ${
                hasSongs ? "text-on-surface" : "text-on-surface-variant/60"
              }`}
            >
              {title}
            </h2>
            <p
              className={`text-xs font-bold uppercase tracking-widest ${
                hasSongs ? "text-on-surface-variant" : "text-on-surface-variant/50"
              }`}
            >
              {hasSongs ? `${songs.length}곡` : "준비 중"}
            </p>
          </div>
        </div>
        {hasSongs && (
          <ChevronDown
            className={`w-5 h-5 text-on-surface-variant transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {hasSongs && open && (
        <ul className="rounded-2xl bg-surface-container-lowest overflow-hidden">
          {songs.map((song, idx) => (
            <li
              key={`${idx}-${song.title}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container-low transition-colors"
            >
              <span className="w-6 text-sm font-black text-on-surface-variant tabular-nums">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-base font-medium text-on-surface truncate">
                {song.title}
              </span>
              {song.youtube_url && (
                <a
                  href={song.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 w-9 h-9 rounded-full bg-[#FF0000] flex items-center justify-center hover:brightness-110 transition-all"
                  title="YouTube에서 재생"
                  aria-label={`${song.title} YouTube에서 재생`}
                >
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {!hasSongs && (
        <p className="text-sm text-on-surface-variant/60 px-1">{emptyLabel}</p>
      )}
    </section>
  );
}
