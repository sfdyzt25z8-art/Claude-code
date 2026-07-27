"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Bell, LogOut, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { initials } from "@/lib/utils";
import { commonNavTop, commonNavBottom, modeNavItems } from "./nav-config";

export function TopNav() {
  const { user, profile, signOutUser } = useAuth();
  const { mode } = useTheme();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/login");
  };

  const allItems = [...commonNavTop, ...modeNavItems[mode], ...commonNavBottom];

  return (
    <header
      className="glass sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 md:px-6"
      style={{ borderColor: "var(--color-border)" }}
    >
      <button
        className="rounded-lg p-2 text-[var(--color-text-primary)] md:hidden"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="rounded-full p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-glass)]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>

        {user?.role === "admin" && (
          <Link
            href="/admin/users"
            className="hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-glass)] sm:flex"
            style={{ borderColor: "var(--color-border)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </Link>
        )}

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border px-1.5 py-1.5 pr-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-glass)]"
            style={{ borderColor: "var(--color-border)" }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-black">
              {initials(profile?.name ?? user?.email)}
            </span>
            <span className="hidden max-w-[8rem] truncate sm:inline">{profile?.name ?? user?.email}</span>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="glass absolute right-0 mt-2 w-48 rounded-2xl border p-1.5 shadow-glass-lg"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                role="menu"
              >
                <Link
                  href="/settings"
                  className="block rounded-xl px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-glass)]"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-[var(--color-surface-glass)]"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass absolute left-0 right-0 top-16 z-30 max-h-[70vh] overflow-y-auto border-b p-3 md:hidden"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            aria-label="Mobile"
          >
            {allItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-glass)]"
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
