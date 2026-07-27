"use client";

import { MessageCircleHeart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChatPanel } from "@/components/ai/ChatPanel";

export default function BusinessCoachPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader title="AI Business Coach" subtitle="Get personalized advice on strategy, growth, and operations." />
      <GlassCard className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
          <MessageCircleHeart className="h-4 w-4 text-[var(--color-accent)]" /> Business Coach
        </div>
        <ChatPanel
          endpoint="/api/business/coach/chat"
          placeholder="Ask your business coach…"
          emptyStateTitle="Ask about growth, pricing, hiring, or strategy."
        />
      </GlassCard>
    </div>
  );
}
