import { getThemeTokens } from "@organizer/shared";
import type { AppMode as SharedAppMode } from "@organizer/shared";
import type { AppMode, Profile } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { chatCompletion, type ChatMessageInput } from "../lib/openai";
import { HttpError } from "../lib/httpError";

export interface RunAiChatParams {
  userId: string;
  profile: Profile | null;
  conversationId?: string;
  message: string;
  /** Recorded on the AiUsageRecord, e.g. "ai.chat" or "business.coach". */
  endpoint: string;
  /** Extra system-prompt guidance layered on top of the default persona (e.g. business-coach framing). */
  extraSystemPrompt?: string;
}

export interface RunAiChatResult {
  conversationId: string;
  reply: string;
  createdAt: string;
}

function modeToShared(mode: AppMode | null | undefined): SharedAppMode | null {
  if (!mode) return null;
  return mode.toLowerCase() as SharedAppMode;
}

function buildSystemPrompt(profile: Profile | null, memoryLines: string[], extra?: string): string {
  const sharedMode = modeToShared(profile?.mode);
  const tokens = getThemeTokens(sharedMode ?? "personal");

  const parts: string[] = [
    "You are the Organizer AI assistant: a supportive, practical life-organization coach for a " +
      "student/business/personal life-OS app. Be concise, warm, and actionable. Prefer concrete " +
      "next steps over generic platitudes.",
    `The user's current app mode is "${sharedMode ?? "not set yet"}". Tone/motivation for this ` +
      `mode: "${tokens.motivation}"`,
  ];

  if (profile?.name) {
    parts.push(`The user's name is ${profile.name}.`);
  }
  if (profile?.ownsBusiness !== null && profile?.ownsBusiness !== undefined) {
    parts.push(
      profile.ownsBusiness
        ? "This user owns a business (business-owner track)."
        : "This user does not own a business (employee/career track)."
    );
  }
  if (memoryLines.length > 0) {
    parts.push("Known long-term facts/preferences about this user:\n" + memoryLines.join("\n"));
  }
  if (extra) {
    parts.push(extra);
  }

  return parts.join("\n\n");
}

/**
 * Shared implementation behind POST /api/ai/chat and POST /api/business/coach/chat.
 * Loads/creates a conversation, persists both sides of the exchange, builds a
 * personalized system prompt from the user's mode/profile + remembered facts,
 * calls the OpenAI wrapper (which itself falls back gracefully), and logs
 * usage - all in one place so both routes stay consistent.
 */
export async function runAiChat(params: RunAiChatParams): Promise<RunAiChatResult> {
  const { userId, profile, message, endpoint } = params;

  let conversationId = params.conversationId;
  if (conversationId) {
    const existing = await prisma.aiConversation.findUnique({ where: { id: conversationId } });
    if (!existing || existing.userId !== userId) {
      throw HttpError.notFound("Conversation not found");
    }
  } else {
    const title = message.trim().slice(0, 60) || "New conversation";
    const created = await prisma.aiConversation.create({ data: { userId, title } });
    conversationId = created.id;
  }

  await prisma.chatMessage.create({
    data: { conversationId, userId, role: "USER", content: message },
  });

  const [memoryItems, recentMessages] = await Promise.all([
    prisma.aiMemoryItem.findMany({ where: { userId }, take: 25, orderBy: { updatedAt: "desc" } }),
    prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const systemPrompt = buildSystemPrompt(
    profile,
    memoryItems.map((m) => `- ${m.key}: ${m.value}`),
    params.extraSystemPrompt
  );

  const history: ChatMessageInput[] = recentMessages
    .slice()
    .reverse()
    .map((m) => ({
      role: m.role === "USER" ? "user" : m.role === "ASSISTANT" ? "assistant" : "system",
      content: m.content,
    }));

  const completion = await chatCompletion([{ role: "system", content: systemPrompt }, ...history]);

  const assistantMessage = await prisma.chatMessage.create({
    data: { conversationId, userId, role: "ASSISTANT", content: completion.content },
  });

  await Promise.all([
    prisma.aiConversation.update({ where: { id: conversationId }, data: {} }),
    prisma.aiUsageRecord.create({
      data: {
        userId,
        endpoint,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
      },
    }),
  ]);

  return {
    conversationId,
    reply: assistantMessage.content,
    createdAt: assistantMessage.createdAt.toISOString(),
  };
}
