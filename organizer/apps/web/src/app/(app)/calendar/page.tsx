"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { CalendarEvent, CalendarEventCategory } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useFetch } from "@/lib/hooks";
import { cn, titleCase } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

const CATEGORY_TONE: Record<CalendarEventCategory, BadgeTone> = {
  homework: "warning",
  exam: "danger",
  business: "accent",
  personal: "success",
  habit: "accent",
  goal: "success",
  reading: "neutral",
  study: "warning",
};

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());

  const range = useMemo(() => {
    if (view === "day") return { from: cursor, to: cursor };
    if (view === "week") return { from: startOfWeek(cursor), to: endOfWeek(cursor) };
    return { from: startOfWeek(startOfMonth(cursor)), to: endOfWeek(endOfMonth(cursor)) };
  }, [view, cursor]);

  const query = `/api/calendar/events?from=${range.from.toISOString()}&to=${range.to.toISOString()}`;
  const { data: events, loading, error } = useFetch<CalendarEvent[]>(query, [query]);

  const days = useMemo(() => eachDayOfInterval({ start: range.from, end: range.to }), [range]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events ?? []) {
      const key = format(new Date(ev.startAt), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [events]);

  const navigate = (dir: -1 | 1) => {
    if (view === "day") setCursor((c) => addDays(c, dir));
    else if (view === "week") setCursor((c) => addWeeks(c, dir));
    else setCursor((c) => addMonths(c, dir));
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="All your homework, exams, goals, and habits in one view."
        action={
          <div className="flex items-center gap-2">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium capitalize",
                  view === v ? "bg-[var(--color-accent)] text-black" : "border"
                )}
                style={view !== v ? { borderColor: "var(--color-border)" } : undefined}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} aria-label="Previous" className="rounded-lg p-2 hover:bg-[var(--color-surface-glass)]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-medium text-[var(--color-text-primary)]">
          {view === "month" ? format(cursor, "MMMM yyyy") : `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`}
        </p>
        <button onClick={() => navigate(1)} aria-label="Next" className="rounded-lg p-2 hover:bg-[var(--color-surface-glass)]">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : view === "month" ? (
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-[var(--color-text-secondary)]">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            return (
              <GlassCard
                key={key}
                padded={false}
                className={cn("flex min-h-[6rem] flex-col gap-1 p-2", !isSameMonth(day, cursor) && "opacity-40")}
              >
                <span className={cn("text-xs font-medium", isSameDay(day, new Date()) && "text-[var(--color-accent)]")}>
                  {format(day, "d")}
                </span>
                <div className="flex flex-col gap-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{ background: "var(--color-surface-glass)" }}
                      title={ev.title}
                    >
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && <span className="text-[10px] text-[var(--color-text-secondary)]">+{dayEvents.length - 3} more</span>}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = (eventsByDay.get(key) ?? []).slice().sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
            return (
              <GlassCard key={key}>
                <p className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">{format(day, "EEEE, MMM d")}</p>
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-secondary)]">No events</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {dayEvents.map((ev) => (
                      <li key={ev.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">{ev.title}</p>
                          {!ev.allDay && (
                            <p className="text-xs text-[var(--color-text-secondary)]">{format(new Date(ev.startAt), "h:mm a")}</p>
                          )}
                        </div>
                        <Badge tone={CATEGORY_TONE[ev.category]}>{titleCase(ev.category)}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassCard>
            );
          })}
          {days.every((day) => !(eventsByDay.get(format(day, "yyyy-MM-dd"))?.length)) && (
            <EmptyState title="No events in this range" icon={CalendarDays} />
          )}
        </div>
      )}
    </div>
  );
}
