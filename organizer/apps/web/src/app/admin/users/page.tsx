"use client";

import { useState } from "react";
import { ShieldOff, ShieldCheck as ShieldCheckIcon, Users } from "lucide-react";
import type { AdminUserSummary } from "@organizer/shared";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Input } from "@/components/ui/Input";
import { useFetch } from "@/lib/hooks";
import { apiPatch } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/utils";

export default function AdminUsersPage() {
  const { data: users, loading, error, refetch } = useFetch<AdminUserSummary[]>("/api/admin/users");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleSuspend = async (u: AdminUserSummary) => {
    setBusyId(u.id);
    try {
      await apiPatch(`/api/admin/users/${u.id}`, { suspended: !u.suspended });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const filtered = (users ?? []).filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase()) || (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Users</h1>
        <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
      </div>

      <GlassCard>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" icon={Users} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-[var(--color-text-secondary)]">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Mode</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Joined</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">{u.name ?? "—"}</td>
                    <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{u.email}</td>
                    <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{u.mode ? titleCase(u.mode) : "—"}</td>
                    <td className="py-2 pr-4">
                      <Badge tone={u.role === "admin" ? "accent" : "neutral"}>{u.role}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{formatDate(u.createdAt)}</td>
                    <td className="py-2 pr-4">
                      <Badge tone={u.suspended ? "danger" : "success"}>{u.suspended ? "Suspended" : "Active"}</Badge>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={busyId === u.id}
                        className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium hover:bg-[var(--color-surface-glass)]"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        {u.suspended ? <ShieldCheckIcon className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                        {u.suspended ? "Reinstate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
