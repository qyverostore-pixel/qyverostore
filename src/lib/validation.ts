export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const namePattern = /^[\p{L}][\p{L}\p{M}\s.'’-]*$/u;

export function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidName(value: string) {
  const name = cleanText(value);
  return name.length >= 2 && name.length <= 100 && namePattern.test(name) && /\p{L}/u.test(name);
}

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

/** Accept Egyptian mobile numbers with optional country prefix, spaces, or hyphens. */
export function normalizeEgyptianPhone(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[+\d\s-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/[\s-]/g, "");
  const local = digits.startsWith("+20") ? `0${digits.slice(3)}` : digits.startsWith("0020") ? `0${digits.slice(4)}` : digits;
  return /^01[0125]\d{8}$/.test(local) ? local : null;
}

export function isPositiveInteger(value: number, maximum = Number.MAX_SAFE_INTEGER) {
  return Number.isInteger(value) && value >= 1 && value <= maximum;
}

export function isNonNegativeNumber(value: number) {
  return Number.isFinite(value) && value >= 0;
}
