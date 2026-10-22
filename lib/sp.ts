export type SP = Promise<Record<string, string | string[] | undefined>>;
/** First value of each search parameter as a plain string. */
export async function readParams(p: SP) {
  const o = await p; const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) { const s = Array.isArray(v) ? v[0] : v; if (s) r[k] = s.slice(0, 80); }
  return r;
}
export const qs = (o: Record<string, string | number | undefined>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v) p.set(k, String(v)); const s = p.toString(); return s ? `?${s}` : ''; };
export const isDate = (v?: string): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
