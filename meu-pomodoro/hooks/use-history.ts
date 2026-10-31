import { useEffect, useState } from "react";

import { getDatabase } from "@/src/database/database";
import { focusStatsBetween, listSessionsBetween } from "@/src/database/repositories";
import type { FocusStats, SessionRecord } from "@/src/types/Session";

export type HistoryStatus = "loading" | "ready" | "error";

export interface HistoryData {
  status: HistoryStatus;
  error: string | null;
  sessions: SessionRecord[];
  stats: FocusStats;
}

const EMPTY_STATS: FocusStats = { completedPomodoros: 0, focusTimeMs: 0 };

/**
 * Lê sessões e estatísticas do período a partir do SQLite. Recarrega quando
 * `reloadKey` muda (nova sessão registrada ou histórico limpo).
 */
export function useHistory(fromMs: number, reloadKey: number): HistoryData {
  const [data, setData] = useState<HistoryData>({
    status: "loading",
    error: null,
    sessions: [],
    stats: EMPTY_STATS,
  });

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const database = await getDatabase();
        const to = Date.now() + 1;
        const [sessions, stats] = await Promise.all([
          listSessionsBetween(database, fromMs, to),
          focusStatsBetween(database, fromMs, to),
        ]);
        if (active) {
          setData({ status: "ready", error: null, sessions, stats });
        }
      } catch (error: unknown) {
        if (active) {
          setData({
            status: "error",
            error: error instanceof Error ? error.message : "Não foi possível carregar o histórico.",
            sessions: [],
            stats: EMPTY_STATS,
          });
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [fromMs, reloadKey]);

  return data;
}
