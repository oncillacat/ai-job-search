"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/chat", label: "Chat" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  return (
    <header>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
        <BrandMark />
        <nav aria-label="Main" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto [scrollbar-width:none] sm:order-2 sm:w-auto">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`) ||
              (l.href === "/chat" && (pathname.startsWith("/jobs") || pathname === "/digest"));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-[15px] transition-colors duration-300 ${
                  active ? "bg-surface font-medium text-ink shadow-sm" : "text-mist-ink hover:bg-surface/50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="order-2 flex items-center gap-1 sm:order-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
