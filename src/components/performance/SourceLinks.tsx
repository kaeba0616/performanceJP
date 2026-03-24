import { Button } from "@/components/ui/button";
import type { SourceListing } from "@/types";

const sourceNames: Record<string, string> = {
  yes24: "예스24",
  interpark: "인터파크",
  melon: "멜론티켓",
};

const sourceColors: Record<string, string> = {
  yes24: "bg-red-500 hover:bg-red-600",
  interpark: "bg-purple-500 hover:bg-purple-600",
  melon: "bg-green-500 hover:bg-green-600",
};

export function SourceLinks({ listings }: { listings: SourceListing[] }) {
  if (listings.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold mb-2">티켓 구매</h3>
      <div className="flex flex-wrap gap-2">
        {listings.map((listing) => (
          <a
            key={listing.id}
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              className={`text-white ${sourceColors[listing.source] || ""}`}
            >
              {sourceNames[listing.source] || listing.source}에서 구매
            </Button>
          </a>
        ))}
      </div>
    </div>
  );
}
