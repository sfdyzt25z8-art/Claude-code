"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import type { AiChatResponse } from "@organizer/shared";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { apiPost, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

export function ChatPanel({
  endpoint,
  placeholder = "Ask anything…",
  initialMessages = [],
  initialConversationId,
  onConversationId,
  emptyStateTitle = "Start a conversation",
}: {
  endpoint: string;
  placeholder?: string;
  initialMessages?: LocalMessage[];
  initialConversationId?: string;
  onConversationId?: (id: string) => void;
  emptyStateTitle?: string;
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    const userMsg: LocalMessage = { id: `local-${Date.now()}`, role: "user", content: text };
    const pendingMsg: LocalMessage = { id: `pending-${Date.now()}`, role: "assistant", content: "", pending: true };
    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setSending(true);
    try {
      const res = await apiPost<AiChatResponse>(endpoint, { message: text, conversationId });
      setConversationId(res.conversationId);
      onConversationId?.(res.conversationId);
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingMsg.id ? { id: res.conversationId + res.createdAt, role: "assistant", content: res.reply } : m))
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== pendingMsg.id));
      setError(err instanceof ApiError ? err.message : "Could not reach the assistant.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center text-[var(--color-text-secondary)]">
            <Bot className="h-8 w-8 text-[var(--color-accent)]" />
            <p className="font-medium">{emptyStateTitle}</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex items-start gap-2", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-[var(--color-accent)] text-black" : "bg-[var(--color-surface-glass)]"
              )}
            >
              {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4 text-[var(--color-accent)]" />}
            </div>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user" ? "bg-[var(--color-accent)] text-black" : "glass border"
              )}
              style={m.role === "assistant" ? { borderColor: "var(--color-border)" } : undefined}
            >
              {m.pending ? <LoadingSpinner label="Thinking" className="py-0" /> : m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          aria-label="Message"
          className="flex-1 rounded-xl border bg-[var(--color-surface-glass)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{ borderColor: "var(--color-border)" }}
        />
        <Button onClick={send} loading={sending} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
