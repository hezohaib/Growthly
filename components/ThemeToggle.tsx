"use client";

import { useTheme } from "next-themes";
import { Icon } from "./ui/Icon";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="icon-btn border border-line bg-surface"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* both icons are in the HTML; CSS shows the right one, so there is no hydration mismatch */}
      <span className="dark:hidden">
        <Icon name="moon" />
      </span>
      <span className="hidden dark:inline">
        <Icon name="sun" />
      </span>
    </button>
  );
}
