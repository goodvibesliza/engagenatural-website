import en from '@/locales/en/verification.json';
import es from '@/locales/es/verification.json';

type Dict = Record<string, any>;

const locales: Record<string, Dict> = { en, es };

export function normalizeLocale(input?: string | null): 'en' | 'es' {
  const v = (input || '').toLowerCase();
  if (v.startsWith('es')) return 'es';
  return 'en';
}

export function getVerifyStrings(locale?: string | null) {
  const l = normalizeLocale(locale);
  return locales[l] || locales.en;
}

export function interpolate(tpl: string, vars: Record<string, any> = {}): string {
  return (tpl || '').replace(/\{{2}\s*([a-zA-Z0-9_\.]+)\s*\}{2}/g, (_m, key) => {
    const val = key.split('.').reduce<any>((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), vars);
    return val == null ? '' : String(val);
  });
}

export type ReasonCode =
  | 'LOCATION_FAR'
  | 'LOCATION_MISSING'
  | 'CODE_INVALID'
  | 'FACE_NOT_VISIBLE'
  | 'BLURRY'
  | 'MULTIPLE_PEOPLE'
  | 'TIME_WINDOW'
  | 'ROSTER_MISMATCH'
  | 'IMAGE_EDIT'
  | 'OTHER';

export function getReasonText(
  locale: string | null | undefined,
  code: ReasonCode,
  params: { distance_m?: number; custom_reason?: string; custom_fix?: string } = {}
) {
  const l = normalizeLocale(locale);
  const strings = locales[l] || locales.en;
  const key = `REASON_${code}`;
  const obj = (strings as any)[key] as { reason?: string; fix?: string } | undefined;
  const reason = interpolate(obj?.reason || '', params);
  const fix = interpolate(obj?.fix || '', params);
  return { reason, fix };
}
