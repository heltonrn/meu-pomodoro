/**
 * Fila serial de gravações no SQLite. As ações do cronômetro atualizam a
 * memória de forma síncrona e enfileiram a gravação, preservando a ordem
 * mesmo com a API assíncrona do banco.
 */
let tail: Promise<void> = Promise.resolve();

export function enqueuePersistence(
  task: () => Promise<void>,
  onError?: (error: unknown) => void,
): Promise<void> {
  tail = tail.then(task).catch((error: unknown) => {
    onError?.(error);
  });
  return tail;
}

/** Aguarda todas as gravações pendentes (útil em testes). */
export function flushPersistence(): Promise<void> {
  return tail;
}
