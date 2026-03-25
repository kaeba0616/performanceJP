export default function PerformanceLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-24 pb-20">
      <div className="animate-pulse">
        <div className="h-5 bg-[#f2f3ff] rounded w-48 mb-8" />
        <div className="flex gap-12">
          <div className="flex-1 space-y-6">
            <div className="h-6 bg-[#f2f3ff] rounded w-24" />
            <div className="h-12 bg-[#f2f3ff] rounded w-full" />
            <div className="h-6 bg-[#f2f3ff] rounded w-40" />
            <div className="bg-[#f2f3ff] rounded-lg h-32 w-full" />
          </div>
          <div className="w-[395px] shrink-0 hidden lg:block">
            <div className="bg-white rounded-lg h-[361px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
