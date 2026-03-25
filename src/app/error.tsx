"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-32 text-center">
      <h1 className="text-4xl font-extrabold text-[#131b2e] mb-4">
        오류가 발생했습니다
      </h1>
      <p className="text-[#424754] mb-8">
        페이지를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요.
      </p>
      <button
        onClick={reset}
        className="bg-[#0058be] text-white font-bold px-6 py-3 rounded-md hover:brightness-110 transition-all"
      >
        다시 시도
      </button>
    </div>
  );
}
