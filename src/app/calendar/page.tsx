import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { createServiceClient } from "@/lib/supabase/server";
import type { Performance } from "@/types";

async function getAllPerformances(): Promise<Performance[]> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("performances")
    .select("*, artist:artists(*)")
    .order("start_date", { ascending: true });

  return (data as Performance[]) || [];
}

export default async function CalendarPage() {
  const performances = await getAllPerformances();

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-24">
      <div className="mb-12">
        <h1 className="editorial-title text-4xl md:text-5xl font-black text-primary mb-3 whitespace-nowrap">
          공연 캘린더
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant font-medium">
          내한 공연 일정을 한눈에 확인하세요.
        </p>
      </div>
      <CalendarGrid performances={performances} />
    </div>
  );
}
