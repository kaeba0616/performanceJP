"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

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
    { href: "/", label: "캘린더" },
    { href: "/artists", label: "아티스트" },
    { href: "/subscribe", label: "알림 설정" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-[12px] bg-[rgba(250,248,255,0.7)] shadow-[0px_1px_2px_0px_rgba(30,58,138,0.05)]">
      <div className="mx-auto max-w-[1280px] flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-bold text-[#1e40af] tracking-[-1px]"
          >
            내한공연 트래커
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive(link.href)
                    ? "text-[#1d4ed8] font-bold text-base tracking-[-0.4px] border-b-2 border-[#2563eb] pb-0.5"
                    : "text-[#475569] text-base tracking-[-0.4px] hover:text-[#1d4ed8] transition-colors"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Search - desktop */}
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#6b7280]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="아티스트 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-[256px] bg-[#f2f3ff] rounded pl-10 pr-4 py-1.5 text-sm tracking-[-0.4px] text-[#131b2e] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 transition-all"
            />
          </form>

          {/* Hamburger - mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#475569] hover:text-[#131b2e]"
            aria-label="메뉴"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgba(194,198,214,0.15)] bg-[rgba(250,248,255,0.95)] backdrop-blur-[12px] px-6 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative sm:hidden">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#6b7280]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="아티스트 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#f2f3ff] rounded pl-10 pr-4 py-2 text-sm text-[#131b2e] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30"
            />
          </form>
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={
                  isActive(link.href)
                    ? "text-[#1d4ed8] font-bold text-base"
                    : "text-[#475569] text-base hover:text-[#1d4ed8]"
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
