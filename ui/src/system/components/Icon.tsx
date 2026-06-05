import {
  Check,
  ChevronDown,
  ChevronRight,
  Menu,
  Moon,
  PanelLeft,
  RefreshCw,
  Search,
  Settings,
  Square,
  Sun,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

export const icons = {
  Check,
  ChevronDown,
  ChevronRight,
  Menu,
  Moon,
  PanelLeft,
  RefreshCw,
  Search,
  Settings,
  Square,
  Sun,
  Trash2,
  X,
} satisfies Record<string, LucideIcon>;

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const className =
    size === "lg"
      ? "w-16 h-16 md:w-20 md:h-20 rounded-2xl text-3xl md:text-4xl"
      : size === "sm"
        ? "w-7 h-7 rounded-md text-xs"
        : "w-9 h-9 rounded-xl text-base";

  return (
    <div
      className={`${className} grid place-items-center text-white font-bold tracking-tight shrink-0`}
      style={{
        background: "linear-gradient(135deg, #FFD21E 0%, #f59e0b 100%)",
        boxShadow: size === "lg" ? "0 16px 48px rgba(255, 210, 30, 0.4)" : "0 6px 20px rgba(255, 210, 30, 0.35)",
        color: size === "sm" ? "#1a1a1a" : undefined,
      }}
    >
      A
    </div>
  );
}
