"use client";

import { useUi } from "@/store/ui";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Topbar() {
  const setSidebar = useUi((s) => s.setSidebar);
  const setPalette = useUi((s) => s.setPalette);
  const openDrawer = useUi((s) => s.openDrawer);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-bg/80 px-4 backdrop-blur sm:px-6">
      <button type="button" className="icon-btn lg:hidden" aria-label="Open menu" onClick={() => setSidebar(true)}>
        <Icon name="menu" size={18} />
      </button>

      <button
        type="button"
        onClick={() => setPalette(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted transition-colors hover:border-accent/50"
      >
        <Icon name="search" />
        <span className="truncate">Search or jump to...</span>
        <span className="ml-auto hidden items-center gap-1 sm:flex">
          <kbd>Ctrl</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <button type="button" className="btn-primary h-9" onClick={() => openDrawer({ mode: "add" })}>
          <Icon name="plus" />
          <span className="hidden sm:inline">Add customer</span>
        </button>
      </div>
    </header>
  );
}
