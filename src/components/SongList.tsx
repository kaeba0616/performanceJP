import type { Song } from "@/types";

interface SongListProps {
  songs: Song[];
  title: string;
}

export function SongList({ songs, title }: SongListProps) {
  if (!songs.length) return null;

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-[#131b2e] mb-4">{title}</h2>
      <ul className="divide-y divide-[#e5e7eb] rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
        {songs.map((song, idx) => (
          <li
            key={`${idx}-${song.title}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-[#f9fafb]"
          >
            <span className="w-6 text-sm font-semibold text-[#727785] tabular-nums">
              {idx + 1}
            </span>
            <span className="flex-1 text-base font-medium text-[#131b2e] truncate">
              {song.title}
            </span>
            {song.youtube_url && (
              <a
                href={song.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-9 h-9 rounded-lg bg-[#FF0000] flex items-center justify-center hover:opacity-80 transition-opacity"
                title="YouTube에서 재생"
                aria-label={`${song.title} YouTube에서 재생`}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
