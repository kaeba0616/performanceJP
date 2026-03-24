import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/date";
import type { Performance } from "@/types";

const statusVariant: Record<Performance["status"], string> = {
  upcoming: "bg-blue-100 text-blue-800",
  on_sale: "bg-green-100 text-green-800",
  sold_out: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-500",
};

const statusLabel: Record<Performance["status"], string> = {
  upcoming: "예정",
  on_sale: "판매중",
  sold_out: "매진",
  completed: "종료",
};

export function PerformanceCard({
  performance,
}: {
  performance: Performance;
}) {
  return (
    <Link href={`/performances/${performance.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold line-clamp-1">
                {performance.title}
              </h3>
              {performance.artist && (
                <p className="text-sm text-muted-foreground">
                  {performance.artist.name_ko}
                </p>
              )}
            </div>
            <Badge className={statusVariant[performance.status]}>
              {statusLabel[performance.status]}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground space-y-0.5">
            <p>{formatDate(performance.start_date)}{performance.end_date ? ` ~ ${formatDate(performance.end_date)}` : ""}</p>
            {performance.venue && <p>{performance.venue}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
