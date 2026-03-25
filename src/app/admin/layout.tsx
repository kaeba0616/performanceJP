"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/admin", label: "대시보드", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/admin/performances", label: "공연 관리", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { href: "/admin/artists", label: "아티스트 관리", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { href: "/admin/import", label: "데이터 가져오기", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin_token");
    if (stored) setToken(stored);
    const savedCollapsed = localStorage.getItem("admin_sidebar_collapsed");
    if (savedCollapsed === "true") setCollapsed(true);
    setChecking(false);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("admin_sidebar_collapsed", String(next));
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setError("비밀번호를 입력하세요.");
      return;
    }
    localStorage.setItem("admin_token", passwordInput.trim());
    setToken(passwordInput.trim());
    setError("");
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    setToken(null);
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-[#424754]">로딩 중...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-[#131b2e] mb-6 text-center">관리자 로그인</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#424754] mb-1">비밀번호</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#0058be]/30 focus:border-[#0058be]"
                placeholder="관리자 비밀번호"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-[#da3437]">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#0058be] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#004a9e] transition-colors"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] flex">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-[#e5e7eb] flex flex-col fixed h-full transition-all duration-200 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <div className={`flex items-center border-b border-[#e5e7eb] ${collapsed ? "justify-center py-5" : "justify-between px-5 py-5"}`}>
          {!collapsed && <h1 className="text-lg font-bold text-[#131b2e]">관리자</h1>}
          <button
            onClick={toggleSidebar}
            className="text-[#424754] hover:text-[#131b2e] transition-colors"
            title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
              } ${
                isActive(item.href)
                  ? "bg-[#0058be]/10 text-[#0058be] font-medium"
                  : "text-[#424754] hover:bg-[#f3f4f6]"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>
        <div className="px-2 py-4 border-t border-[#e5e7eb]">
          <button
            onClick={handleLogout}
            title={collapsed ? "로그아웃" : undefined}
            className={`w-full text-sm text-[#424754] hover:text-[#da3437] hover:bg-[#fef2f2] rounded-lg transition-colors ${
              collapsed ? "flex justify-center py-2.5" : "text-left px-3 py-2"
            }`}
          >
            {collapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            ) : (
              "로그아웃"
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 p-8 transition-all duration-200 ${collapsed ? "ml-16" : "ml-56"}`}>
        {children}
      </main>
    </div>
  );
}
