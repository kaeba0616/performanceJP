"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "대시보드" },
  { key: "performances", label: "공연" },
  { key: "reservations", label: "예약" },
  { key: "announcements", label: "공지" },
  { key: "members", label: "멤버" },
];

export function ManageNav({ handle }: { handle: string }) {
  const pathname = usePathname();
  const base = `/o/${handle}/manage`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-outline-variant">
      {TABS.map((tab) => {
        const href = tab.key ? `${base}/${tab.key}` : base;
        const active =
          tab.key === ""
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "px-4 py-2.5 text-sm font-bold tracking-tight whitespace-nowrap border-b-2 -mb-px transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
