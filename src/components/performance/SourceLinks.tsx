import type { SourceListing } from "@/types";

const sourceConfig: Record<string, { label: string; className: string; timeHost: string }> = {
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
        <p className="text-sm font-bold text-[#424754] mb-4">
          공식 예매처 바로가기
        </p>
      )}
      <div className={isLarge ? "grid grid-cols-3 gap-4" : "flex flex-wrap gap-2"}>
        {listings.map((listing) => {
          const config = sourceConfig[listing.source] || {
            label: listing.source,
            className: "bg-gray-500",
            timeHost: "",
          };
          return (
            <div key={listing.id} className={isLarge ? "flex flex-col gap-2" : ""}>
              <a
                href={listing.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${config.className} text-white font-bold text-center rounded transition-all block ${
                  isLarge
                    ? "py-4 text-base"
                    : "px-4 py-2 text-xs"
                }`}
              >
                {isLarge ? `${config.label}에서 구매` : config.label}
              </a>
              {isLarge && config.timeHost && (
                <a
                  href={`https://time.navyism.com/?host=${config.timeHost}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold border-2 border-[#c2c6d6]/30 text-[#424754] hover:border-[#0058be] hover:text-[#0058be] rounded py-2.5 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
