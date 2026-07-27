import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../middleware/errorHandler";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";
import { runAiChat } from "../services/aiChat";

const router = Router();

const chatSchema = z.object({
  conversationId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(4000),
});

/**
 * POST /api/ai/chat
 * Body: AiChatRequest { conversationId?, message }. Loads/creates a
 * conversation, stores both sides of the exchange, and returns AiChatResponse.
 */
router.post(
  "/chat",
  requireAuth,
  validateBody(chatSchema),
  asyncHandler(async (req, res) => {
    const { conversationId, message } = req.body as z.infer<typeof chatSchema>;
    const result = await runAiChat({
      userId: req.user!.id,
      profile: req.profile ?? null,
      conversationId,
      message,
      endpoint: "ai.chat",
    });
    res.json(result);
  })
);

router.get(
  "/conversations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
    });
    res.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        userId: c.userId,
        title: c.title,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  })
);

router.get(
  "/conversations/:id/messages",
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversation = await prisma.aiConversation.findUnique({ where: { id: req.params.id } });
    if (!conversation || conversation.userId !== req.user!.id) {
      throw HttpError.notFound("Conversation not found");
    }
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    });
    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        userId: m.userId,
        conversationId: m.conversationId,
        role: m.role.toLowerCase(),
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  })
);

router.get(
  "/suggestions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const suggestions = await prisma.aiSuggestion.findMany({
      where: { userId: req.user!.id, dismissed: false },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      suggestions: suggestions.map((s) => ({
        id: s.id,
        userId: s.userId,
        category: s.category,
        title: s.title,
        body: s.body,
        createdAt: s.createdAt.toISOString(),
        dismissed: s.dismissed,
      })),
    });
  })
);

router.post(
  "/suggestions/:id/dismiss",
  requireAuth,
  asyncHandler(async (req, res) => {
    const suggestion = await prisma.aiSuggestion.findUnique({ where: { id: req.params.id } });
    if (!suggestion || suggestion.userId !== req.user!.id) {
      throw HttpError.notFound("Suggestion not found");
    }
    const updated = await prisma.aiSuggestion.update({
      where: { id: suggestion.id },
      data: { dismissed: true },
    });
    res.json({
      suggestion: {
        id: updated.id,
        userId: updated.userId,
        category: updated.category,
        title: updated.title,
        body: updated.body,
        createdAt: updated.createdAt.toISOString(),
        dismissed: updated.dismissed,
      },
    });
  })
);

export default router;
