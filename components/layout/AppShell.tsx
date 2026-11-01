"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUi } from "@/store/ui";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";
import { CustomerDrawer } from "./CustomerDrawer";
import { Toaster } from "./Toaster";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const togglePalette = useUi((s) => s.togglePalette);

  // Ctrl/Cmd + K opens the command palette from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar />
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <CommandPalette />
      <CustomerDrawer />
      <Toaster />
    </div>
  );
}
