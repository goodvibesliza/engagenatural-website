import en from '@/locales/en/verification.json';
import es from '@/locales/es/verification.json';

type Dict = Record<string, any>;

const locales: Record<string, Dict> = { en, es };

/**
 * Normalize a locale identifier to either 'en' or 'es'.
 *
 * @param input - Locale string to normalize (e.g., "en-US", "es-ES", null). Matching is case-insensitive; values that start with "es" map to `'es'`.
 * @returns `'es'` if `input` starts with "es" (case-insensitive), otherwise `'en'`.
 */
export function normalizeLocale(input?: string | null): 'en' | 'es' {
  const v = (input || '').toLowerCase();
  if (v.startsWith('es')) return 'es';
  return 'en';
}

/**
 * Retrieve verification strings for the given locale.
 *
 * @param locale - Optional locale identifier (e.g., 'en', 'es', or a language tag); case-insensitive.
 * @returns The verification strings dictionary for the normalized locale ('en' or 'es'), defaulting to English when the locale is missing or unrecognized.
 */
export function getVerifyStrings(locale?: string | null) {
  const l = normalizeLocale(locale);
  return locales[l] || locales.en;
}

/**
 * Replace {{ key }} placeholders in a template with values from a variable map.
 *
 * Supports nested keys using dot notation (for example `user.name`) and ignores whitespace inside the braces.
 *
 * @param tpl - Template string containing placeholders like `{{ key }}`; an empty or falsy template yields an empty string
 * @param vars - Mapping of keys to values used for interpolation; nested properties can be accessed with dot-separated keys
 * @returns The template with each `{{ key }}` replaced by the corresponding value converted to a string; `undefined` or `null` values are replaced with an empty string
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
 * Retrieve localized reason and fix messages for a verification failure code, with template variable interpolation.
 *
 * @param locale - Locale identifier used to select translations; values starting with `es` select Spanish, all others select English.
 * @param code - Verification failure reason code to look up.
 * @param params - Optional template variables for interpolation. Supported keys:
 *   - `distance_m`: distance in meters (number) for insertion into templates
 *   - `custom_reason`: fallback or custom reason text
 *   - `custom_fix`: fallback or custom fix text
 * @returns An object with `reason` and `fix` containing the localized, interpolated messages.
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