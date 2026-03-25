import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { createServerClient } from "@/lib/supabase/server";
import type { Performance } from "@/types";

async function getAllPerformances(): Promise<Performance[]> {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("performances")
    .select("*, artist:artists(*)")
    .order("start_date", { ascending: true });

  return (data as Performance[]) || [];
}

export default async function HomePage() {
  const performances = await getAllPerformances();

  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-24 pb-36">
      <div className="mb-10">
        <h2 className="text-[30px] font-black text-[#131b2e] tracking-[-1.5px] leading-[36px]">
          내한공연 캘린더
        </h2>
        <p className="text-base text-[#424754] mt-2">
          일본 아티스트 내한 공연 일정을 한눈에 확인하세요
        </p>
      </div>
      <CalendarGrid performances={performances} />
    </div>
  );
}
