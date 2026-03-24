import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#f8fafc] border-t border-[#e2e8f0]">
      <div className="mx-auto max-w-[1280px] flex items-center justify-between px-8 py-12">
        <div className="flex flex-col gap-2">
          <span className="font-bold text-base text-[#1e293b]">
            내한공연 트래커
          </span>
          <span className="text-sm text-[#64748b]">
            &copy; {new Date().getFullYear()} 내한공연 트래커. All rights
            reserved.
          </span>
        </div>
        <div className="flex gap-8">
          <Link
            href="#"
            className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            이용약관
          </Link>
          <Link
            href="#"
            className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            개인정보처리방침
          </Link>
          <Link
            href="#"
            className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            문의하기
          </Link>
        </div>
      </div>
    </footer>
  );
}
