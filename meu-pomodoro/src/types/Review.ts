export interface ReviewStateRecord {
  /** Primeiro uso do app (base da espera mínima antes do primeiro pedido). */
  firstSeenAt: string;
  completed: boolean;
  snoozeCount: number;
  nextPromptAt: string | null;
}

export interface ReviewEngagement {
  /** Dias distintos com ao menos um foco concluído. */
  daysWithFocus: number;
  /** Total de focos concluídos. */
  completedFocus: number;
}

export type ReviewStateChange = Partial<
  Pick<ReviewStateRecord, "completed" | "snoozeCount" | "nextPromptAt">
>;
