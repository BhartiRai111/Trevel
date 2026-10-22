export const isEmail = (s: unknown): s is string => typeof s === 'string' && s.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
/** Indian mobile number: 10 digits starting 6-9 (optional +91 / 0 prefix is stripped). */
export function cleanPhone(s: unknown): string | null {
  if (typeof s !== 'string') return null;
  const d = s.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}
export const cleanName = (s: unknown) => (typeof s === 'string' && s.trim().length >= 2 && s.trim().length <= 80 ? s.trim() : null);
