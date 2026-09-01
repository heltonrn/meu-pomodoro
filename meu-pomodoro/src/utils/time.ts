export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatClockTime(timestampMs: number): string {
  const date = new Date(timestampMs);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Regra fundamental (requisito 10): o tempo restante é sempre derivado do
 * horário real de término previsto, nunca de um contador decrementado.
 */
export function remainingFromTarget(targetEndsAt: number, now: number): number {
  return Math.max(0, targetEndsAt - now);
}

export function startOfToday(): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Início da semana (segunda-feira, 00:00). */
export function startOfWeek(): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = domingo
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return date.getTime();
}

export function formatDurationMinutes(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h${String(minutes).padStart(2, '0')}` : `${hours}h`;
}
