// Fonts: Geist (UI) + Libre Baskerville (headings)
export const BODY_STACK =
  'Geist, "Geist Fallback", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
export const HEADING_STACK = '"Libre Baskerville", Georgia, serif';

import { useEffect } from 'react'

export function BrandFonts() {
  // Load fonts after first render to keep component pure and avoid StrictMode double-run issues
  useEffect(() => {
    Promise.all([
      import('@fontsource-variable/geist'),
      import('@fontsource/libre-baskerville'),
      import('@fontsource/ibm-plex-mono/400.css'),
    ]).catch((err) => {
      // Non-blocking: log for diagnostics but do not surface to users
      console.error('BrandFonts: failed to load one or more fonts', err)
    })
  }, [])

  return null;
}

export const classes = {
  body: 'font-sans',
  heading: 'font-serif',
};
