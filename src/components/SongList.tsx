import { Play } from "lucide-react";
import type { Song } from "@/types";

interface SongListProps {
  songs: Song[];
  title: string;
}

export function SongList({ songs, title }: SongListProps) {
  if (!songs.length) return null;

  return (
    <section className="mb-10">
      <h2 className="editorial-title-sm text-2xl font-black text-on-surface mb-5">
        {title}
      </h2>
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
    </section>
  );
}
