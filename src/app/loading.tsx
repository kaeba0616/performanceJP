export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-24 pb-36">
      <div className="animate-pulse space-y-6">
        <div className="h-9 bg-[#f2f3ff] rounded w-48" />
        <div className="h-5 bg-[#f2f3ff] rounded w-72" />
        <div className="grid grid-cols-7 gap-0 mt-8">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-[100px] bg-[#f2f3ff]/50 border border-[rgba(194,198,214,0.1)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
