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
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      className="flex min-w-64 max-w-sm items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-lg"
    >
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-white",
          toast.tone === "success" && "bg-good",
          toast.tone === "error" && "bg-bad",
          toast.tone === "info" && "bg-accent text-on-accent",
        )}
      >
        <Icon name={toast.tone === "error" ? "alert" : "check"} size={12} />
      </span>
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="font-semibold text-accent hover:underline"
          onClick={() => {
            toast.action?.onClick();
            dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2 [&>*]:pointer-events-auto">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
