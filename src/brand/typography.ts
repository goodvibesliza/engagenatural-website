/*
  Brand typography integration
  - Provides font stacks and a BrandFonts component that wires the custom
    display font "Code" with safe fallbacks.
*/

import React from 'react'

// Fallback mono font for display usage
// Note: This import is safe even if the actual "Code" font files are missing.
// NOTE: Fallback font CSS is imported globally from src/index.css to avoid
// bundler resolution issues in some CI environments.

export const BODY_STACK = 'Geist, "Geist Fallback", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
export const HEADING_STACK = '"Libre Baskerville", Georgia, serif'
export const DISPLAY_STACK = '"Code", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export const classes = {
  body: 'font-sans',
  heading: 'font-serif',
  display: 'font-display',
}

export function BrandFonts(): JSX.Element {
  // Inject @font-face for "Code"; files may not exist yet. font-display: swap.
  const css = `
  @font-face {
    font-family: 'Code';
    src: url('/fonts/code.woff2') format('woff2'),
         url('/fonts/code.woff') format('woff');
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    /* Basic Latin range */
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
                   U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074,
                   U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
                   U+FEFF, U+FFFD;
  }
  `
  return React.createElement(
    'style',
    { dangerouslySetInnerHTML: { __html: css } } as any,
  )
}

export default BrandFonts
