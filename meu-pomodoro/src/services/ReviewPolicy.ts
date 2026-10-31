/**
 * Regras puras (sem APIs nativas) do pedido de avaliação do app.
 * Tudo aqui é determinístico: o "agora" sempre entra por parâmetro.
 */
import type { ReviewStateChange } from "../types/Review";

export const REVIEW_FEEDBACK_EMAIL = "contato@volvet.com.br";

export const REVIEW_MIN_DAYS_SINCE_INSTALL = 3;
export const REVIEW_MIN_DAYS_WITH_FOCUS = 4;
export const REVIEW_MIN_FOCUS_COMPLETED = 15;
export const REVIEW_MAX_SNOOZES = 3;
export const REVIEW_SNOOZE_DAYS = 30;
export const REVIEW_FEEDBACK_COOLDOWN_DAYS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewAnswer = "yes" | "improve" | "later";

export interface ReviewEligibilityInput {
  firstSeenAt: string;
  completed: boolean;
  snoozeCount: number;
  nextPromptAt: string | null;
  daysWithFocus: number;
  completedFocus: number;
  /** O pedido só aparece num momento de sucesso: um foco acabou de ser concluído. */
  justCompletedFocus: boolean;
}

/**
 * Aceita ISO 8601 e também o formato do SQLite `datetime('now')`
 * ("YYYY-MM-DD HH:MM:SS", em UTC). Retorna null se não for interpretável.
 */
export function parseStoredTimestamp(value: string): number | null {
  const trimmed = value.trim();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed.replace(" ", "T")}Z`
    : trimmed;
  const parsed = Date.parse(normalized);

  return Number.isNaN(parsed) ? null : parsed;
}

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

export function shouldPromptReview(input: ReviewEligibilityInput, now: Date): boolean {
  if (input.completed || !input.justCompletedFocus) {
    return false;
  }

  if (input.snoozeCount >= REVIEW_MAX_SNOOZES) {
    return false;
  }

  const firstSeenMs = parseStoredTimestamp(input.firstSeenAt);
  if (firstSeenMs === null || now.getTime() - firstSeenMs < REVIEW_MIN_DAYS_SINCE_INSTALL * DAY_MS) {
    return false;
  }

  const hasEnoughEngagement =
    input.daysWithFocus >= REVIEW_MIN_DAYS_WITH_FOCUS ||
    input.completedFocus >= REVIEW_MIN_FOCUS_COMPLETED;
  if (!hasEnoughEngagement) {
    return false;
  }

  if (input.nextPromptAt !== null) {
    const nextPromptMs = parseStoredTimestamp(input.nextPromptAt);
    if (nextPromptMs !== null && now.getTime() < nextPromptMs) {
      return false;
    }
  }

  return true;
}

export function getReviewStateAfterAnswer(
  answer: ReviewAnswer,
  snoozeCount: number,
  now: Date,
): ReviewStateChange {
  switch (answer) {
    case "yes":
      return { completed: true, nextPromptAt: null };
    case "improve":
      return { nextPromptAt: addDays(now, REVIEW_FEEDBACK_COOLDOWN_DAYS) };
    case "later":
      return {
        snoozeCount: snoozeCount + 1,
        nextPromptAt: addDays(now, REVIEW_SNOOZE_DAYS),
      };
  }
}

export const FEEDBACK_CATEGORIES = [
  "Cronômetro",
  "Notificações",
  "Visual",
  "Algo não funciona",
  "Outro",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export interface FeedbackMailInput {
  category: FeedbackCategory;
  message: string;
  appVersion: string;
  platform: string;
  osVersion: string;
}

export function buildFeedbackMailtoUrl(input: FeedbackMailInput): string {
  const subject = `Sugestão — Meu Pomodoro (${input.category})`;
  const body = [
    input.message.trim(),
    "",
    "—",
    `Meu Pomodoro ${input.appVersion} · ${input.platform} ${input.osVersion}`,
  ].join("\n");

  return `mailto:${REVIEW_FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
