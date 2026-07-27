import OpenAI from "openai";
import type { Subject } from "@organizer/shared";
import { generateFallbackQuestions } from "../services/quizBank";

export interface ChatMessageInput {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  /** true when a real OpenAI call produced this result, false when we fell back locally. */
  usedOpenAi: boolean;
}

export interface GeneratedQuizQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

let client: OpenAI | null = null;
let attemptedInit = false;
let warnedMissingKey = false;

function getClient(): OpenAI | null {
  if (client || attemptedInit) return client;
  attemptedInit = true;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (!warnedMissingKey) {
      // eslint-disable-next-line no-console
      console.warn(
        "[openai] OPENAI_API_KEY is not set. AI chat and quiz generation will use local " +
          "fallback content instead of calling the OpenAI API."
      );
      warnedMissingKey = true;
    }
    return null;
  }
  client = new OpenAI({ apiKey });
  return client;
}

export function isOpenAiConfigured(): boolean {
  return getClient() !== null;
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Calls OpenAI chat completions. Never throws: on any failure (missing key,
 * network error, rate limit, etc.) it returns a graceful local fallback
 * message so callers never see a crashed request.
 */
export async function chatCompletion(
  messages: ChatMessageInput[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<ChatCompletionResult> {
  const openai = getClient();
  if (!openai) {
    return {
      content: localFallbackReply(messages),
      promptTokens: 0,
      completionTokens: 0,
      usedOpenAi: false,
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 600,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return {
        content: localFallbackReply(messages),
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        usedOpenAi: false,
      };
    }

    return {
      content,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      usedOpenAi: true,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[openai] chatCompletion failed, using local fallback:", (err as Error).message);
    return {
      content: localFallbackReply(messages),
      promptTokens: 0,
      completionTokens: 0,
      usedOpenAi: false,
    };
  }
}

function localFallbackReply(messages: ChatMessageInput[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const topic = lastUser?.content?.slice(0, 160) ?? "that";
  return (
    "I'm currently running in offline mode (no AI provider configured), so I can't generate a " +
    `full response yet. Here's a quick note on "${topic}": break it into smaller steps, track ` +
    "your progress in Organizer, and check back once the AI assistant is fully connected for a " +
    "richer answer."
  );
}

/**
 * Generates quiz questions for a subject via OpenAI. Falls back to the local
 * static question bank if OpenAI is unavailable or the call fails/returns
 * something we can't parse - callers always get `count` valid questions back.
 */
export async function generateQuizQuestions(
  subject: Subject,
  count: number,
  difficulty: "easy" | "medium" | "hard" | "mixed" = "mixed"
): Promise<GeneratedQuizQuestion[]> {
  const openai = getClient();
  if (!openai) {
    return generateFallbackQuestions(subject, count);
  }

  try {
    const difficultyHint =
      difficulty === "mixed"
        ? "a mix of easy, medium, and hard difficulty"
        : `${difficulty} difficulty`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.8,
      max_tokens: 1800,
      messages: [
        {
          role: "system",
          content:
            "You are a quiz question generator for an educational app. Respond ONLY with strict " +
            "JSON (no markdown fences, no commentary): an array of objects each shaped as " +
            '{"prompt": string, "choices": string[4], "correctIndex": number (0-3), ' +
            '"explanation": string, "difficulty": "easy"|"medium"|"hard"}. Every question must ' +
            "be factually correct and unambiguous.",
        },
        {
          role: "user",
          content: `Generate exactly ${count} multiple-choice quiz questions about the school subject "${subject}", with ${difficultyHint}.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonText = extractJsonArray(raw);
    const parsed = JSON.parse(jsonText) as unknown;
    if (!Array.isArray(parsed)) throw new Error("OpenAI response was not a JSON array");

    const questions: GeneratedQuizQuestion[] = parsed
      .filter(isValidGeneratedQuestion)
      .slice(0, count);

    if (questions.length < count) {
      const padding = generateFallbackQuestions(subject, count - questions.length);
      return [...questions, ...padding];
    }
    return questions;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "[openai] generateQuizQuestions failed, using local fallback bank:",
      (err as Error).message
    );
    return generateFallbackQuestions(subject, count);
  }
}

function extractJsonArray(text: string): string {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return "[]";
  return text.slice(start, end + 1);
}

function isValidGeneratedQuestion(value: unknown): value is GeneratedQuizQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Record<string, unknown>;
  return (
    typeof q.prompt === "string" &&
    Array.isArray(q.choices) &&
    q.choices.length === 4 &&
    q.choices.every((c) => typeof c === "string") &&
    typeof q.correctIndex === "number" &&
    q.correctIndex >= 0 &&
    q.correctIndex <= 3 &&
    typeof q.explanation === "string" &&
    (q.difficulty === "easy" || q.difficulty === "medium" || q.difficulty === "hard")
  );
}
