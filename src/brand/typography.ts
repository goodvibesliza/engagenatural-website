// Fonts: Geist (UI) + Libre Baskerville (headings)
export const BODY_STACK =
  'Geist, "Geist Fallback", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
export const HEADING_STACK = '"Libre Baskerville", Georgia, serif';

export function BrandFonts() {
  // Factory: ensure these packages are installed:
  // npm i @fontsource-variable/geist @fontsource/libre-baskerville
  import('@fontsource-variable/geist');
  import('@fontsource/libre-baskerville');
  return null;
}

export const classes = {
  body: 'font-sans',
  heading: 'font-serif',
};
