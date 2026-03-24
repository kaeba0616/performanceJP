import Link from "next/link";

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <Link href="/" className="text-lg font-bold">
          내한공연 트래커
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            캘린더
          </Link>
          <Link
            href="/artists"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            아티스트
          </Link>
          <Link
            href="/subscribe"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            알림 설정
          </Link>
        </nav>
      </div>
    </header>
  );
}
