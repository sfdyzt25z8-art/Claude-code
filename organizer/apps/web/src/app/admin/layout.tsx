"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, BookOpen, Bot, GraduationCap, ShieldCheck, Users, Megaphone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: GraduationCap },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/notifications", label: "Broadcast", icon: Megaphone },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/ai-usage", label: "AI Usage", icon: Bot },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Checking admin access" />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="glass hidden w-64 shrink-0 flex-col border-r px-3 py-5 md:flex" style={{ borderColor: "var(--color-border)" }}>
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="rounded-xl bg-[var(--color-accent)]/20 p-1.5">
            <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Organizer</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Admin console</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname?.startsWith(item.href)
                  ? "bg-[var(--color-accent)]/20 text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-primary)]"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="mt-auto text-xs text-[var(--color-accent)] hover:underline">
          ← Back to app
        </Link>
      </aside>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
