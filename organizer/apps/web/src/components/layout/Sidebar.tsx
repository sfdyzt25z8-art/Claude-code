"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { commonNavTop, commonNavBottom, modeNavItems, type NavItem } from "./nav-config";
import { cn } from "@/lib/utils";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--color-accent)]/20 text-[var(--color-text-primary)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-primary)]"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { mode, tokens } = useTheme();
  const items = modeNavItems[mode];

  return (
    <aside
      className={cn(
        "glass hidden h-full w-64 shrink-0 flex-col border-r px-3 py-5 md:flex",
        className
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
        <div className="rounded-xl bg-[var(--color-accent)]/20 p-1.5">
          <Sparkles className="h-5 w-5 text-[var(--color-accent)]" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Organizer</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{tokens.label} mode</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Primary">
        {commonNavTop.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}
        <div className="my-2 border-t" style={{ borderColor: "var(--color-border)" }} />
        {items.map((item) => (
          <NavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
        ))}
        <div className="my-2 border-t" style={{ borderColor: "var(--color-border)" }} />
        {commonNavBottom.map((item) => (
          <NavLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} />
        ))}
      </nav>

      <div className="mt-4 rounded-xl bg-[var(--color-surface-glass)] p-3 text-xs text-[var(--color-text-secondary)]">
        {tokens.motivation}
      </div>
    </aside>
  );
}
