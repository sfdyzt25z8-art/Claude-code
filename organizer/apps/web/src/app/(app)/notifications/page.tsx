"use client";

import { Bell, BellRing, CheckCheck } from "lucide-react";
import type { NotificationRecord } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { apiPatch } from "@/lib/api";
import { cn, formatDate, titleCase } from "@/lib/utils";

export default function NotificationsPage() {
  const { data: notificationsRes, loading, error, refetch, setData } = useFetch<{
    notifications: NotificationRecord[];
  }>("/api/notifications");
  const notifications = notificationsRes?.notifications;

  const markRead = async (id: string) => {
    setData((prev) =>
      prev ? { notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) } : prev
    );
    try {
      await apiPatch(`/api/notifications/${id}/read`, {});
    } catch {
      refetch();
    }
  };

  const sorted = (notifications ?? []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = sorted.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : sorted.length === 0 ? (
        <EmptyState title="No notifications yet" icon={Bell} />
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((n) => (
            <GlassCard
              key={n.id}
              className={cn("flex items-start gap-3", !n.read && "border-[var(--color-accent)]")}
              onClick={() => !n.read && markRead(n.id)}
            >
              {n.read ? (
                <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
              ) : (
                <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--color-text-primary)]">{n.title}</p>
                  <Badge tone="neutral">{titleCase(n.category)}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{n.body}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{formatDate(n.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
