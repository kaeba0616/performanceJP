import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-32 text-center">
      <p className="text-8xl font-extrabold text-[#0058be] mb-4">404</p>
      <h1 className="text-2xl font-bold text-[#131b2e] mb-2">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-[#424754] mb-8">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="inline-block bg-[#0058be] text-white font-bold px-6 py-3 rounded-md hover:brightness-110 transition-all"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
