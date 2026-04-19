"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Users, BellRing } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Schedules", icon: CalendarDays },
  { href: "/artists", label: "Artists", icon: Users },
  { href: "/subscribe", label: "Alerts", icon: BellRing },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[rgba(250,248,255,0.85)] backdrop-blur-xl border-t border-outline-variant/20 px-6 py-3 flex justify-between items-center">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
              active ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            <Icon
              className="w-5 h-5"
              strokeWidth={active ? 2.5 : 2}
              fill={active ? "currentColor" : "none"}
              fillOpacity={active ? 0.15 : 0}
            />
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
