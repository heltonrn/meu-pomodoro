export function assertIntegerInRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${fieldName} deve ser um número inteiro entre ${min} e ${max}.`);
  }
}

export function assertNonNegativeInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} deve ser um número inteiro maior ou igual a zero.`);
  }
}
