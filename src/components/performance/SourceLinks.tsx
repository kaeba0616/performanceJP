import { Clock } from "lucide-react";
import type { SourceListing } from "@/types";

const sourceConfig: Record<
  string,
  { label: string; className: string; timeHost: string }
> = {
  yes24: {
    label: "예스24",
    className: "btn-yes24",
    timeHost: "ticket.yes24.com",
  },
  interpark: {
    label: "인터파크",
    className: "btn-interpark",
    timeHost: "tickets.interpark.com",
  },
  melon: {
    label: "멜론티켓",
    className: "btn-melon",
    timeHost: "ticket.melon.com",
  },
  ticketlink: {
    label: "티켓링크",
    className: "btn-ticketlink",
    timeHost: "www.ticketlink.co.kr",
  },
  other: {
    label: "예매하기",
    className: "btn-other",
    // 기타 예매처는 도메인이 다양해서 서버시간 링크 미표시
    timeHost: "",
  },
};

export function SourceLinks({
  listings,
  size = "default",
}: {
  listings: SourceListing[];
  size?: "default" | "large";
}) {
  if (listings.length === 0) return null;

  const isLarge = size === "large";

  return (
    <div>
      {isLarge && (
        <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4">
          공식 예매처
        </p>
      )}
      <div
        className={
          isLarge
            ? "grid grid-cols-1 sm:grid-cols-3 gap-4"
            : "flex flex-wrap gap-2"
        }
      >
        {listings.map((listing) => {
          const config = sourceConfig[listing.source] || {
            label: listing.source,
            className: "bg-on-surface-variant",
            timeHost: "",
          };
          return (
            <div key={listing.id} className={isLarge ? "flex flex-col gap-2" : ""}>
              <a
                href={listing.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${config.className} text-white font-black text-center rounded-xl transition-all block ${
                  isLarge ? "py-4 text-sm" : "px-4 py-2 text-xs rounded-lg"
                }`}
              >
                {isLarge ? `${config.label}에서 구매` : config.label}
              </a>
              {isLarge && config.timeHost && (
                <a
                  href={`https://time.navyism.com/?host=${config.timeHost}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary bg-surface-container-low hover:bg-primary-fixed rounded-xl py-2.5 transition-all"
                >
                  <Clock className="w-3.5 h-3.5" />
                  서버시간 확인
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
