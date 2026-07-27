"use client";

import Link from "next/link";
import { Wallet, PiggyBank, Target, TrendingUp, Megaphone, Landmark, MessageCircleHeart } from "lucide-react";
import type { ExpenseEntry, RevenueEntry } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { BusinessDashboard } from "@/components/dashboards/BusinessDashboard";

const LINKS = [
  { href: "/business/finances", label: "Finances", icon: Wallet, desc: "Revenue & expenses" },
  { href: "/business/budget", label: "Budget", icon: PiggyBank, desc: "Spending limits" },
  { href: "/business/goals", label: "Goals", icon: Target, desc: "Business targets" },
  { href: "/business/investments", label: "Investments", icon: TrendingUp, desc: "Portfolio tracking" },
  { href: "/business/marketing", label: "Marketing", icon: Megaphone, desc: "Campaign plan" },
  { href: "/business/academies", label: "Academies", icon: Landmark, desc: "Grow your skills" },
  { href: "/business/coach", label: "AI Coach", icon: MessageCircleHeart, desc: "Business coaching chat" },
];

export default function BusinessOverviewPage() {
  const { profile } = useAuth();
  const isOwner = profile?.ownsBusiness ?? profile?.businessRole === "owner";
  const { data: revenue, loading: revLoading } = useFetch<RevenueEntry[]>(isOwner ? "/api/business/revenue" : null);
  const { data: expenses, loading: expLoading } = useFetch<ExpenseEntry[]>(isOwner ? "/api/business/expenses" : null);

  const totalRevenue = (revenue ?? []).reduce((s, r) => s + r.amount, 0);
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Business Overview"
        subtitle={isOwner ? "A snapshot of your business health, right now." : "Your workspace for career growth."}
      />

      {isOwner && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <GlassCard>
            <p className="text-xs text-[var(--color-text-secondary)]">Revenue</p>
            {revLoading ? <LoadingSpinner /> : (
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalRevenue, profile?.currency)}</p>
            )}
          </GlassCard>
          <GlassCard>
            <p className="text-xs text-[var(--color-text-secondary)]">Expenses</p>
            {expLoading ? <LoadingSpinner /> : (
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{formatCurrency(totalExpenses, profile?.currency)}</p>
            )}
          </GlassCard>
          <GlassCard>
            <p className="text-xs text-[var(--color-text-secondary)]">Net profit</p>
            <p className={`mt-1 text-2xl font-bold ${totalRevenue - totalExpenses >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatCurrency(totalRevenue - totalExpenses, profile?.currency)}
            </p>
          </GlassCard>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {LINKS.map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <GlassCard hoverable className="flex flex-col gap-2 py-6 text-center">
              <Icon className="mx-auto h-6 w-6 text-[var(--color-accent)]" />
              <p className="font-semibold text-[var(--color-text-primary)]">{label}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>

      <BusinessDashboard />
    </div>
  );
}
