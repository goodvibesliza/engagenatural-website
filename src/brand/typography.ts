// ======================================
// CultureTest Typography System
// ======================================

import React from 'react';
import '@fontsource-variable/geist';
import '@fontsource/libre-baskerville';

// Font stack definitions
export const BODY_STACK = 'Geist, "Geist Fallback", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
export const HEADING_STACK = '"Libre Baskerville", Georgia, serif';

// BrandFonts component to load fonts
export const BrandFonts: React.FC = () => {
  return null; // Font imports are handled via the imports at top of file
};

// CSS class helpers
export const classes = {
  body: {
    fontFamily: BODY_STACK,
  },
  heading: {
    fontFamily: HEADING_STACK,
  },
} as const;