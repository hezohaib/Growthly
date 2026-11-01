"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUi, type Toast } from "@/store/ui";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUi((s) => s.dismissToast);

  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), toast.action ? 6000 : 3500);
    return () => clearTimeout(id);
  }, [toast.id, toast.action, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.92, transition: { duration: 0.2, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className="group flex min-w-72 max-w-sm items-center gap-3.5 rounded-xl border border-line bg-surface/95 px-4 py-3.5 text-sm shadow-xl backdrop-blur-md transition-shadow hover:shadow-2xl"
    >
      <span
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-surface",
          toast.tone === "success" && "bg-good",
          toast.tone === "error" && "bg-bad",
          toast.tone === "info" && "bg-accent text-on-accent",
        )}
      >
        <Icon name={toast.tone === "error" ? "alert" : "check"} size={13} />
      </span>
      <span className="flex-1 font-medium leading-snug">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="rounded px-1.5 py-0.5 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft hover:underline"
          onClick={() => {
            toast.action?.onClick();
            dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss toast"
        onClick={() => dismiss(toast.id)}
        className="opacity-0 transition-opacity group-hover:opacity-100 text-muted hover:text-fg -mr-1 p-0.5"
      >
        <Icon name="x" size={14} />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[70] flex flex-col gap-2.5 [&>*]:pointer-events-auto">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
