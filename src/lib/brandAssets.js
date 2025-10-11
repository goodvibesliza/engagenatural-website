// src/lib/brandAssets.js
// Tiny resolver for brand logos. Returns a URL (string) or null if not found.
// Uses existing src/data/brandLogos.ts assets when available.

import { BRAND_LOGOS } from '../data/brandLogos.ts';

export function getBrandLogo(brandId) {
  try {
    const key = String(brandId || '').toLowerCase().trim();
    if (!key) return null;

    // Try match by alt text containing the brand key
    const match = BRAND_LOGOS.find((it) => String(it?.alt || '').toLowerCase().includes(key));
    if (match?.src) return match.src;

    // Heuristic fallbacks for a few common keys
    if (key.includes('bach')) {
      const m = BRAND_LOGOS.find((it) => /bach/i.test(it?.alt));
      if (m?.src) return m.src;
    }

    return null;
  } catch {
    return null;
  }
}

export function getBrandInitial(brandNameOrId) {
  const s = String(brandNameOrId || '').trim();
  return s ? s.charAt(0).toUpperCase() : 'B';
}
