"use client";

import { useState } from "react";
import { MessageSquarePlus, Sparkles, X } from "lucide-react";
import type { AiConversation, AiSuggestion, ChatMessage } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChatPanel } from "@/components/ai/ChatPanel";
import { useFetch } from "@/lib/hooks";
import { apiPatch } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

export default function AiAssistantPage() {
  const { data: conversations, loading: convLoading, refetch: refetchConversations } = useFetch<AiConversation[]>("/api/ai/conversations");
  const { data: suggestions, loading: suggLoading, refetch: refetchSuggestions } = useFetch<AiSuggestion[]>("/api/ai/suggestions");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const openConversation = async (id: string) => {
    setActiveConversationId(id);
    setLoadingThread(true);
    try {
      const messages = await import("@/lib/api").then((m) => m.apiGet<ChatMessage[]>(`/api/ai/conversations/${id}/messages`));
      setInitialMessages(messages);
    } catch {
      setInitialMessages([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setInitialMessages([]);
  };

  const dismissSuggestion = async (id: string) => {
    try {
      await apiPatch(`/api/ai/suggestions/${id}`, { dismissed: true });
      refetchSuggestions();
    } catch {
      // ignore failures — suggestion simply stays visible
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
        <GlassCard className="flex-1 overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text-primary)]">Conversations</h2>
            <button
              onClick={startNewConversation}
              aria-label="New conversation"
              className="rounded-lg p-1.5 text-[var(--color-accent)] hover:bg-[var(--color-surface-glass)]"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
          </div>
          {convLoading ? (
            <LoadingSpinner />
          ) : (conversations ?? []).length === 0 ? (
            <EmptyState title="No conversations yet" />
          ) : (
            <ul className="flex flex-col gap-1">
              {(conversations ?? [])
                .slice()
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => openConversation(c.id)}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                        activeConversationId === c.id ? "bg-[var(--color-accent)]/20" : "hover:bg-[var(--color-surface-glass)]"
                      )}
                    >
                      <p className="truncate font-medium text-[var(--color-text-primary)]">{c.title || "Untitled chat"}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{formatDate(c.updatedAt)}</p>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Suggestions for you</h2>
          </div>
          {suggLoading ? (
            <LoadingSpinner />
          ) : (suggestions ?? []).filter((s) => !s.dismissed).length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)]">Nothing new right now — check back later.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(suggestions ?? [])
                .filter((s) => !s.dismissed)
                .slice(0, 5)
                .map((s) => (
                  <li key={s.id} className="rounded-xl border p-3 text-xs" style={{ borderColor: "var(--color-border)" }}>
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="font-medium text-[var(--color-text-primary)]">{s.title}</p>
                      <button onClick={() => dismissSuggestion(s.id)} aria-label="Dismiss suggestion" className="shrink-0 text-[var(--color-text-secondary)]">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">{s.body}</p>
                  </li>
                ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <GlassCard className="flex flex-1 flex-col overflow-hidden">
        <PageHeader title="Organizer AI" subtitle="Your personalized assistant, grounded in your data." />
        {loadingThread ? (
          <LoadingSpinner />
        ) : (
          <ChatPanel
            key={activeConversationId ?? "new"}
            endpoint="/api/ai/chat"
            initialMessages={initialMessages.map((m) => ({ id: m.id, role: m.role === "system" ? "assistant" : m.role, content: m.content }))}
            initialConversationId={activeConversationId ?? undefined}
            onConversationId={() => refetchConversations()}
            emptyStateTitle="Ask me anything about your homework, business, or habits."
          />
        )}
      </GlassCard>
    </div>
  );
}
