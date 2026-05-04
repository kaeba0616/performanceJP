import Link from "next/link";
import { formatDate } from "@/lib/utils/date";

export interface StampCardProps {
  performanceId: string;
  performanceTitle: string;
  performanceDate: string;
  venue: string | null;
  imageUrl: string | null;
  artistName: string | null;
  stampNumber: number;
  size?: "default" | "small";
}

export function StampCard({
  performanceId,
  performanceTitle,
  performanceDate,
  venue,
  imageUrl,
  artistName,
  stampNumber,
  size = "default",
}: StampCardProps) {
  return (
    <Link
      href={`/performances/${performanceId}`}
      className="group block bg-surface-container-lowest rounded-2xl p-3 hover:shadow-xl hover:scale-[1.02] transition-all"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-container-high">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={performanceTitle}
            className="w-full h-full object-cover sepia-[0.15] group-hover:sepia-0 transition-all"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed to-primary-fixed-dim flex items-center justify-center">
            <span className="editorial-title font-black italic text-on-primary-fixed-variant/40 text-3xl tracking-tighter">
              {artistName?.charAt(0) || "?"}
            </span>
          </div>
        )}
        <StampMark size={size} />
      </div>

      <div className="pt-3 px-1 pb-1">
        <p className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
          STAMP #{String(stampNumber).padStart(3, "0")}
        </p>
        <p className="mt-0.5 text-xs font-bold text-on-surface-variant tracking-tight">
          {formatDate(performanceDate)}
        </p>
        <p
          className={`mt-1 font-black text-on-surface tracking-tight truncate ${
            size === "small" ? "text-xs" : "text-sm"
          }`}
        >
          {performanceTitle}
        </p>
        {venue && (
          <p className="text-xs text-on-surface-variant truncate mt-0.5">
            {venue}
          </p>
        )}
      </div>
    </Link>
  );
}

function StampMark({ size }: { size: "default" | "small" }) {
  const dim = size === "small" ? 56 : 72;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 100 100"
      className="absolute top-2 right-2 drop-shadow-md"
      style={{ transform: "rotate(-12deg)" }}
      aria-hidden
    >
      <defs>
        <path
          id="circle-text"
          d="M 50,50 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0"
        />
      </defs>
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#8f0013"
        strokeWidth="2.5"
        opacity="0.85"
      />
      <circle
        cx="50"
        cy="50"
        r="36"
        fill="none"
        stroke="#8f0013"
        strokeWidth="1.5"
        opacity="0.85"
      />
      <text
        fontFamily="Inter, sans-serif"
        fontSize="8"
        fontWeight="900"
        fill="#8f0013"
        opacity="0.9"
        letterSpacing="2"
      >
        <textPath href="#circle-text" startOffset="0%">
          ATTENDED · ATTENDED · ATTENDED ·
        </textPath>
      </text>
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="14"
        fontWeight="900"
        fill="#8f0013"
        opacity="0.95"
      >
        다녀옴
      </text>
    </svg>
  );
}
