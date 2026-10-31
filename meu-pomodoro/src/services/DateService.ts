function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function getLocalDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getLocalTime(date: Date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getCurrentTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}
