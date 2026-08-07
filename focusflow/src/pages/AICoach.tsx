import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Sparkles, Send, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getAICoachResponse, isAIProviderConfigured } from '@/lib/aiCoach';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/FormControls';

const suggestedPrompts = [
  'What should I work on today?',
  "I'm behind on my goal",
  'Help me organize my tasks',
  'How are my habits going?',
];

export default function AICoach() {
  const tasks = useAppStore((s) => s.tasks);
  const goals = useAppStore((s) => s.goals);
  const habits = useAppStore((s) => s.habits);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const userName = useAppStore((s) => s.settings.profile.name);
  const aiMessages = useAppStore((s) => s.aiMessages);
  const addAIMessage = useAppStore((s) => s.addAIMessage);
  const clearAIMessages = useAppStore((s) => s.clearAIMessages);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const connected = isAIProviderConfigured();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [aiMessages, isThinking]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    addAIMessage({ role: 'user', content: trimmed });
    setInput('');
    setIsThinking(true);
    try {
      const response = await getAICoachResponse(trimmed, { tasks, goals, habits, focusSessions, userName });
      addAIMessage({ role: 'assistant', content: response });
    } catch {
      addAIMessage({
        role: 'assistant',
        content: "Sorry, I couldn't come up with a response just now. Try asking again in a moment.",
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:h-[calc(100vh-6rem)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-[var(--color-text)]">
            <Sparkles size={22} className="text-[var(--color-primary)]" /> AI Coach
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Ask for help planning, prioritizing, or staying motivated.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={connected ? 'success' : 'default'}>
            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {connected ? 'Connected AI' : 'Local suggestions'}
          </Badge>
          {aiMessages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAIMessages}>
              <Trash2 size={14} /> Clear
            </Button>
          )}
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {aiMessages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="font-medium text-[var(--color-text)]">Hi{userName && userName !== 'there' ? `, ${userName}` : ''}! I'm your AI Coach.</p>
                <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
                  Ask me anything about your tasks, goals, or habits — or try one of these:
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {aiMessages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text)]'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-[var(--color-surface-hover)] px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-subtle)] [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-subtle)] [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-subtle)]" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[var(--color-border)] p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI Coach..."
            aria-label="Message the AI Coach"
            maxLength={500}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isThinking} aria-label="Send message">
            <Send size={16} />
          </Button>
        </form>
      </Card>
    </div>
  );
}
