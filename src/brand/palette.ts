// Petal-pink palette sampled from screenshot
export const BG_PAGE_LIGHT = "#FFFFFF";   // base page
export const BG_TINT       = "#F6E3DC";   // petal wash for sections/cards
export const BG_ELEVATED   = "#FFFDFB";   // near-white for panels (optional)

export const TEXT_PRIMARY  = "#0E0E0E";
export const TEXT_INVERSE  = "#FFFFFF";
export const MUTED         = "#5C5754";

export const ACCENT_PINK   = "#F2D4CA";   // primary accent (petal)
export const ACCENT_PINK_LIGHT = "#F3DAD1";
export const ACCENT_PINK_DARK  = "#CDB4AB";

export const BORDER        = "#E8C9C2";   // soft pink border

// Buttons (keep high contrast; add a pink variant for emphasis)
export const BUTTON = {
  primary:   { bg: "#0E0E0E", fg: "#FFFFFF", hover: "#1A1A1A", border: "#0E0E0E" },
  secondary: { bg: "transparent", fg: "#0E0E0E", border: "#0E0E0E", hover: "#0E0E0E", hoverFg: "#FFFFFF" },
  pink:      { bg: ACCENT_PINK, fg: "#0E0E0E", hover: ACCENT_PINK_DARK, border: ACCENT_PINK }
};
