"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, LogOut, Stamp, User } from "lucide-react";

interface Props {
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  initial: string;
  email: string;
  signOutAction: () => Promise<void>;
}

export function UserMenuClient({
  handle,
  displayName,
  avatarUrl,
  initial,
  email,
  signOutAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="사용자 메뉴"
        className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm overflow-hidden hover:ring-2 hover:ring-primary/30 transition"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl py-2 z-50">
          <div className="px-4 py-3 border-b border-outline-variant">
            <div className="text-sm font-bold text-on-surface truncate">
              {displayName || (handle ? `@${handle}` : "사용자")}
            </div>
            <div className="text-xs text-on-surface-variant truncate">
              {handle ? `@${handle}` : email}
            </div>
          </div>
          <div className="py-1">
            <MenuLink href="/me" icon={<User className="w-4 h-4" />} onClick={() => setOpen(false)}>
              내 프로필
            </MenuLink>
            <MenuLink
              href="/me/stamps"
              icon={<Stamp className="w-4 h-4" />}
              onClick={() => setOpen(false)}
            >
              내 스탬프
            </MenuLink>
            <MenuLink
              href="/me/settings"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => setOpen(false)}
            >
              설정
            </MenuLink>
          </div>
          <div className="border-t border-outline-variant py-1">
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error font-semibold hover:bg-surface-container-low transition"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition"
    >
      {icon}
      {children}
    </Link>
  );
}
