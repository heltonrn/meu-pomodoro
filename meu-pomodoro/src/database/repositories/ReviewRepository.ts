import type { SQLiteBindValue, SQLiteDatabase } from "expo-sqlite";

import { SessionType } from "../../types";
import type { ReviewEngagement, ReviewStateChange, ReviewStateRecord } from "../../types/Review";

interface ReviewStateRow {
  first_seen_at: string;
  completed: number;
  snooze_count: number;
  next_prompt_at: string | null;
}

export async function getReviewState(database: SQLiteDatabase): Promise<ReviewStateRecord> {
  const row = await database.getFirstAsync<ReviewStateRow>(
    "SELECT first_seen_at, completed, snooze_count, next_prompt_at FROM review_state WHERE id = 1 LIMIT 1;",
  );

  if (!row) {
    throw new Error("Estado da avaliação não encontrado.");
  }

  return {
    firstSeenAt: row.first_seen_at,
    completed: row.completed === 1,
    snoozeCount: row.snooze_count,
    nextPromptAt: row.next_prompt_at,
  };
}

export async function updateReviewState(
  database: SQLiteDatabase,
  change: ReviewStateChange,
): Promise<void> {
  const assignments: string[] = [];
  const values: SQLiteBindValue[] = [];

  if (change.completed !== undefined) {
    assignments.push("completed = ?");
    values.push(change.completed ? 1 : 0);
  }
  if (change.snoozeCount !== undefined) {
    assignments.push("snooze_count = ?");
    values.push(change.snoozeCount);
  }
  if (change.nextPromptAt !== undefined) {
    assignments.push("next_prompt_at = ?");
    values.push(change.nextPromptAt);
  }

  if (assignments.length === 0) {
    return;
  }

  await database.runAsync(`UPDATE review_state SET ${assignments.join(", ")} WHERE id = 1;`, ...values);
}

/** Engajamento a partir do histórico já gravado (focos concluídos, nunca pulados). */
export async function getReviewEngagement(database: SQLiteDatabase): Promise<ReviewEngagement> {
  const row = await database.getFirstAsync<{ days: number; total: number }>(
    `SELECT COUNT(DISTINCT date(started_at / 1000, 'unixepoch', 'localtime')) AS days,
            COUNT(*) AS total
     FROM sessions
     WHERE type = ? AND completed = 1;`,
    SessionType.Focus,
  );

  return { daysWithFocus: row?.days ?? 0, completedFocus: row?.total ?? 0 };
}
