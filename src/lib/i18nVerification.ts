import en from '@/locales/en/verification.json';
import es from '@/locales/es/verification.json';

type Dict = Record<string, any>;

const locales: Record<string, Dict> = { en, es };

/**
 * Normalize a locale identifier to either `en` or `es`.
 *
 * @param input - Locale string (for example `"en-US"` or `"es"`); `null` or `undefined` are treated as empty
 * @returns `es` if the normalized input begins with `es`, `en` otherwise
 */
export function normalizeLocale(input?: string | null): 'en' | 'es' {
  const v = (input || '').toLowerCase();
  if (v.startsWith('es')) return 'es';
  return 'en';
}

/**
 * Selects the verification strings dictionary for a given locale.
 *
 * @param locale - Locale identifier (e.g., "en", "es", or regional variants). May be null or undefined.
 * @returns The verification strings dictionary for the resolved locale ("en" or "es"); falls back to the English dictionary if the resolved locale is not present.
 */
export function getVerifyStrings(locale?: string | null) {
  const l = normalizeLocale(locale);
  return locales[l] || locales.en;
}

/**
 * Interpolates placeholders of the form `{{ key }}` in a template using values from `vars`.
 *
 * @param tpl - Template string containing placeholders that may use dot-paths (e.g., `{{ user.name }}`)
 * @param vars - Object used to resolve placeholder keys; nested properties are accessed via dot-paths
 * @returns The template with each placeholder replaced by its corresponding value; placeholders with missing or undefined values are replaced with an empty string
 */
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

/**
 * Get localized reason and suggested fix text for a verification reason code.
 *
 * @param locale - Locale identifier (e.g., "en", "es"). Null or undefined will be normalized to a supported locale.
 * @param code - The reason code indicating the verification failure.
 * @param params - Optional interpolation parameters; supports `distance_m` for numeric distance, `custom_reason` and `custom_fix` for custom text substitutions.
 * @returns An object with `reason` and `fix` strings after interpolating provided parameters; missing entries are returned as empty strings.
 */
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