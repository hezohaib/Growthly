import { initials } from "@/lib/customer";
import { hashString } from "@/lib/utils";
import { cn } from "@/lib/cn";

const GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-orange-500",
  "from-fuchsia-500 to-purple-500",
  "from-amber-500 to-orange-500",
];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-semibold text-white", gradient)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}
