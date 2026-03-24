import type { SourceListing } from "@/types";

const sourceConfig: Record<string, { label: string; className: string }> = {
  yes24: { label: "예스24", className: "btn-yes24" },
  interpark: { label: "인터파크", className: "btn-interpark" },
  melon: { label: "멜론티켓", className: "btn-melon" },
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
          };
          return (
            <a
              key={listing.id}
              href={listing.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${config.className} text-white font-bold text-center rounded transition-all ${
                isLarge
                  ? "py-4 text-base"
                  : "px-4 py-2 text-xs rounded"
              } inline-block`}
            >
              {isLarge ? `${config.label}에서 구매` : config.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
