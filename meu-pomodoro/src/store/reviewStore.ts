import { create } from "zustand";

import { getDatabase } from "../database/database";
import { getReviewEngagement, getReviewState, updateReviewState } from "../database/repositories";
import { enqueuePersistence } from "../services/PersistenceQueue";
import { getReviewStateAfterAnswer, type ReviewAnswer } from "../services/ReviewPolicy";
import type { ReviewEngagement, ReviewStateRecord } from "../types/Review";

interface ReviewStoreState {
  state: ReviewStateRecord | null;
  engagement: ReviewEngagement | null;
  /** Carrega estado e engajamento do banco. Falhas são silenciosas (recurso opcional). */
  refresh: () => Promise<void>;
  /** Atualiza a memória na hora e enfileira a gravação. */
  answer: (answer: ReviewAnswer) => void;
}

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  state: null,
  engagement: null,

  refresh: async () => {
    try {
      const database = await getDatabase();
      const [state, engagement] = await Promise.all([
        getReviewState(database),
        getReviewEngagement(database),
      ]);
      set({ state, engagement });
    } catch {
      // O pedido de avaliação é opcional: uma falha aqui nunca deve afetar o app.
    }
  },

  answer: (answer) => {
    const current = get().state;
    if (current === null) {
      return;
    }

    const change = getReviewStateAfterAnswer(answer, current.snoozeCount, new Date());
    set({ state: { ...current, ...change } });

    void enqueuePersistence(async () => {
      const database = await getDatabase();
      await updateReviewState(database, change);
    });
  },
}));
