export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-24 pb-36">
      <div className="animate-pulse space-y-8">
        <div>
          <div className="h-9 bg-[#f2f3ff] rounded w-64 mb-3" />
          <div className="h-5 bg-[#f2f3ff] rounded w-48" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl bg-[#f2f3ff]" />
              <div className="space-y-2">
                <div className="h-7 bg-[#f2f3ff] rounded w-32" />
                <div className="h-5 bg-[#f2f3ff] rounded w-40" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg h-64" />
              <div className="bg-white rounded-lg h-64" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
