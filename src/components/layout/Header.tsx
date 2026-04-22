"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Search, Menu, X, Bell } from "lucide-react";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setMobileMenuOpen(false);
    }
  }

  const navLinks = [
    { href: "/", label: "홈", en: "Home" },
    { href: "/calendar", label: "캘린더", en: "Schedules" },
    { href: "/artists", label: "아티스트", en: "Artists" },
    { href: "/submit", label: "제보", en: "Submit" },
    { href: "/subscribe", label: "알림", en: "Alerts" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[rgba(250,248,255,0.8)]">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-2xl font-black italic tracking-tighter text-primary whitespace-nowrap"
          >
            THE PULSE
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive(link.href)
                    ? "text-primary font-bold text-sm tracking-tight transition-colors"
                    : "text-on-surface-variant font-medium text-sm tracking-tight hover:text-primary transition-colors"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              type="search"
              placeholder="아티스트 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-[240px] bg-surface-container-low rounded-full pl-10 pr-4 py-2 text-sm tracking-tight text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </form>

          <Link
            href="/subscribe"
            aria-label="알림 설정"
            className="hidden sm:inline-flex p-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <Bell className="w-5 h-5" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-on-surface-variant hover:text-on-surface"
            aria-label="메뉴"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[rgba(250,248,255,0.98)] backdrop-blur-xl px-6 py-5 space-y-5">
          <form onSubmit={handleSearch} className="relative sm:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              type="search"
              placeholder="아티스트 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-container-low rounded-full pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </form>
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={
                  isActive(link.href)
                    ? "text-primary font-bold text-base tracking-tight"
                    : "text-on-surface-variant font-medium text-base tracking-tight hover:text-primary"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
