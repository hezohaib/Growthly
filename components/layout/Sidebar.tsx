"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCustomers } from "@/hooks/useCustomers";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "dashboard" },
  { href: "/customers", label: "Customers", icon: "users" },
  { href: "/reports", label: "Reports", icon: "chart" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const open = useUi((s) => s.sidebarOpen);
  const setSidebar = useUi((s) => s.setSidebar);
  const customerCount = useCustomers().length;

  // close the mobile drawer after navigating
  useEffect(() => {
    setSidebar(false);
  }, [pathname, setSidebar]);

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebar(false)} aria-hidden="true" />}

      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2.5 px-4">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 20V10" />
              <path d="M12 20V4" />
              <path d="M18 20v-7" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Growthly</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-accent" : "text-muted hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-accent-soft"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative flex items-center gap-2.5">
                  <Icon name={item.icon} size={17} />
                  {item.label}
                </span>
                {item.href === "/customers" && (
                  <span className="relative ml-auto rounded-full bg-line/70 px-2 text-xs tabular-nums text-muted">{customerCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl border border-line bg-bg p-3">
          <p className="text-[13px] font-semibold">Pro tip</p>
          <p className="mt-1 text-xs text-muted">
            Press <kbd>Ctrl</kbd> <kbd>K</kbd> to jump to any page or customer.
          </p>
        </div>
      </aside>
    </>
  );
}
