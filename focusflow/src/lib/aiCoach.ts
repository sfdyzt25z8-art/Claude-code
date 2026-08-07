/**
 * AI Coach service.
 *
 * This module is the single integration point for AI-generated coaching
 * responses. When `VITE_AI_API_KEY` is set, `getAICoachResponse` calls out to
 * a real AI provider. Without a key — the default, out-of-the-box state —
 * it falls back to a local, rule-based response generator that reads the
 * user's actual tasks/goals/habits and gives genuinely useful suggestions.
 *
 * To wire up a real provider: implement `callAIProvider` below to POST to
 * your provider's chat/completions endpoint (e.g. the Anthropic Messages
 * API) using `import.meta.env.VITE_AI_API_KEY` and `import.meta.env.VITE_AI_MODEL`.
 * Keep the request client-side-safe or, better, proxy it through your own
 * backend so the API key is never bundled into shipped frontend code.
 */

import type { FocusSession, Goal, Habit, Task } from '@/types';
import { daysUntil, isOverdue, todayISODate } from '@/lib/date';
import { goalProgress, habitStreakInfo, todaysTasks } from '@/lib/derived';

export interface AICoachContext {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  focusSessions: FocusSession[];
  userName?: string;
}

const apiKey = import.meta.env.VITE_AI_API_KEY as string | undefined;
const apiModel = (import.meta.env.VITE_AI_MODEL as string | undefined) ?? 'claude-sonnet-5';

export function isAIProviderConfigured(): boolean {
  return Boolean(apiKey && apiKey.trim().length > 0);
}

export async function getAICoachResponse(message: string, context: AICoachContext): Promise<string> {
  if (isAIProviderConfigured()) {
    try {
      return await callAIProvider(message, context);
    } catch (error) {
      console.warn('[aiCoach] Provider call failed, using local fallback.', error);
      return localCoachResponse(message, context);
    }
  }
  return localCoachResponse(message, context);
}

/** Real provider integration. Not called unless VITE_AI_API_KEY is set. */
async function callAIProvider(message: string, context: AICoachContext): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey ?? '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: apiModel,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider responded with ${response.status}`);
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === 'text')?.text;
  if (!text) throw new Error('AI provider returned an empty response');
  return text;
}

function buildSystemPrompt(context: AICoachContext): string {
  return [
    'You are the AI Coach inside FocusFlow, a productivity app.',
    'Give short, warm, actionable productivity coaching based on the data provided.',
    'Keep responses under 150 words.',
    `Today: ${todayISODate()}`,
    `Tasks: ${JSON.stringify(context.tasks.slice(0, 50))}`,
    `Goals: ${JSON.stringify(context.goals.slice(0, 20))}`,
    `Habits: ${JSON.stringify(context.habits.slice(0, 20))}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Local fallback — works with zero configuration.
// ---------------------------------------------------------------------------

function localCoachResponse(rawMessage: string, context: AICoachContext): string {
  const message = rawMessage.toLowerCase().trim();
  const name = context.userName?.trim();
  const greetName = name && name !== 'there' ? `, ${name}` : '';

  const today = todaysTasks(context.tasks);
  const overdue = context.tasks.filter((t) => isOverdue(t.dueDate, t.completed));
  const incompleteToday = today.filter((t) => !t.completed);
  const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
  const nextTask = [...overdue, ...incompleteToday].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  )[0];

  const strugglingGoals = context.goals
    .map((g) => ({ goal: g, progress: goalProgress(g, context.tasks), days: daysUntil(g.deadline) }))
    .filter((g) => g.days !== null && g.days <= 7 && g.days >= 0 && g.progress < 70);

  const brokenHabits = context.habits.filter((h) => {
    const info = habitStreakInfo(h);
    return !info.completedToday && info.weeklyCompletions < info.weeklyTarget;
  });

  if (/\b(hi|hello|hey)\b/.test(message) && message.length < 20) {
    return `Hey${greetName}! I'm your AI Coach. Ask me what to work on today, how you're tracking against a goal, or for help organizing your tasks.`;
  }

  if (message.includes('what should i work on') || message.includes('what to work on') || message.includes('today')) {
    if (!nextTask) {
      return today.length === 0
        ? `You don't have any tasks due today${greetName}. Great time to plan ahead — add a task or check in on one of your goals.`
        : `Nice work${greetName} — everything due today is already done. Consider getting ahead on tomorrow, or spend the time on a habit or a focus session.`;
    }
    const urgency = overdue.includes(nextTask) ? 'overdue' : 'due today';
    return `I'd start with "${nextTask.title}" — it's ${nextTask.priority} priority and ${urgency}. ${
      incompleteToday.length > 1 ? `You have ${incompleteToday.length} tasks left today; tackle the highest-priority ones first.` : ''
    } Want a suggestion after that one's done?`;
  }

  if (message.includes('behind') || message.includes('overwhelm') || message.includes('stress')) {
    if (strugglingGoals.length > 0) {
      const g = strugglingGoals[0];
      return `It's okay${greetName} — "${g.goal.name}" is at ${g.progress}% with ${g.days} day${g.days === 1 ? '' : 's'} left. Break it into 2-3 small tasks today rather than trying to finish it all at once. Momentum matters more than speed.`;
    }
    return `Take a breath${greetName}. Overdue items: ${overdue.length}. Pick just one small task to finish right now — clearing even one thing usually makes the rest feel lighter.`;
  }

  if (message.includes('organi')) {
    const categories = new Set(context.tasks.map((t) => t.category).filter(Boolean));
    return `Here's a quick way to organize: group by category (you're already using ${categories.size || 'a few'}${
      categories.size ? '' : ' — try adding some'
    }), sort by priority within each day, and link tasks to a goal wherever they serve one. ${
      overdue.length > 0 ? `Start by clearing your ${overdue.length} overdue task${overdue.length === 1 ? '' : 's'} or moving their due dates.` : 'Your task list looks current — nothing overdue.'
    }`;
  }

  if (message.includes('habit')) {
    if (brokenHabits.length > 0) {
      const h = brokenHabits[0];
      const info = habitStreakInfo(h);
      return `"${h.name}" is at ${info.weeklyCompletions}/${info.weeklyTarget} this week with a ${info.currentStreak}-day streak. A quick win today keeps it alive — even a short version counts.`;
    }
    return `Your habits are looking solid${greetName} — every one is on pace for its weekly target. Keep the streaks going!`;
  }

  if (message.includes('goal')) {
    if (context.goals.length === 0) {
      return "You don't have any goals yet. Try creating one with a deadline and a couple of linked tasks — breaking a goal into concrete tasks is the single best way to make progress on it.";
    }
    const sorted = [...context.goals].sort(
      (a, b) => goalProgress(a, context.tasks) - goalProgress(b, context.tasks),
    );
    const lowest = sorted[0];
    return `"${lowest.name}" has the most room to grow, at ${goalProgress(lowest, context.tasks)}% complete. Try adding one small task toward it today — steady progress beats a big push later.`;
  }

  if (message.includes('focus') || message.includes('pomodoro') || message.includes('timer')) {
    return 'Head to the Focus tab and start a 25-minute session — put your phone out of reach, pick one task, and work until the timer ends. Short breaks between sessions keep your energy up over the day.';
  }

  if (message.includes('motivat')) {
    return `You've got this${greetName}. Progress compounds — a few minutes today on the right task is worth more than waiting for the "perfect" time. Pick the smallest next step and start there.`;
  }

  // Generic fallback that still uses real data.
  const parts: string[] = [];
  if (overdue.length > 0) parts.push(`${overdue.length} task${overdue.length === 1 ? ' is' : 's are'} overdue`);
  if (incompleteToday.length > 0) parts.push(`${incompleteToday.length} due today`);
  if (strugglingGoals.length > 0) parts.push(`${strugglingGoals.length} goal${strugglingGoals.length === 1 ? '' : 's'} approaching its deadline`);

  if (parts.length === 0) {
    return `Everything looks under control${greetName}. Ask me things like "what should I work on today?" or "help me organize my tasks" any time.`;
  }
  return `Here's where things stand: ${parts.join(', ')}. Ask me "what should I work on today?" and I'll point you to the best next task.`;
}
