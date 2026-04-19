import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatDate, getDDay } from "@/lib/utils/date";
import { normalizeSongs, type Performance } from "@/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: "UPCOMING", className: "status-upcoming" },
  on_sale: { label: "ON SALE", className: "status-on-sale" },
  sold_out: { label: "SOLD OUT", className: "status-sold-out" },
  completed: { label: "종료", className: "status-completed" },
};

function pickFirstPrice(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const first = trimmed.split("/")[0]?.trim() ?? trimmed;
  return first.length > 24 ? `${first.slice(0, 22)}…` : first;
}

export function PerformanceCard({
  performance,
}: {
  performance: Performance;
}) {
  const status = statusConfig[performance.status] || statusConfig.upcoming;
  const isSoldOut =
    performance.status === "sold_out" || performance.status === "completed";
  const setlistCount = normalizeSongs(performance.setlist).length;
  const image = performance.image_url || performance.artist?.image_url || null;
  const dday = !isSoldOut ? getDDay(performance.start_date) : null;
  const price = pickFirstPrice(performance.price_info);

  return (
    <Link
      href={`/performances/${performance.id}`}
      className="group relative flex flex-col bg-surface-container-low rounded-2xl overflow-hidden hover:shadow-[0_10px_40px_rgba(26,27,32,0.05)] transition-all duration-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-container">
        {image ? (
          <img
            src={image}
            alt={performance.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-fixed to-surface-container-high flex items-center justify-center">
            <span className="text-4xl font-black italic text-primary/40 tracking-tighter">
              THE PULSE
            </span>
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span
            className={`${status.className} px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase`}
          >
            {status.label}
          </span>
          {dday && (
            <span className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xl font-black shadow-lg w-fit">
              {dday}
            </span>
          )}
        </div>
        {setlistCount > 0 && (
          <span className="absolute top-4 right-4 bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Setlist {setlistCount}
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3
          className={`editorial-title-sm text-xl md:text-2xl font-black mb-2 line-clamp-2 transition-colors ${
            isSoldOut
              ? "text-on-surface-variant"
              : "text-on-surface group-hover:text-primary"
          }`}
        >
          {performance.title}
        </h3>
        {performance.venue && (
          <p className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-4">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{performance.venue}</span>
          </p>
        )}
        <div className="mt-auto pt-4 flex justify-between items-center">
          <span className="text-sm font-bold text-primary">
            {formatDate(performance.start_date)}
          </span>
          {price && (
            <span
              className={`text-sm font-black ${
                isSoldOut ? "text-on-surface-variant" : "text-on-surface"
              }`}
            >
              {price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
