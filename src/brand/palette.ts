// ======================================
// CultureTest Brand Color Palette
// ======================================
// Monochrome base with sage-green accent for "natural" moments

export const BG_PAGE_LIGHT = "#FFFFFF";
export const BG_PAGE_DARK = "#000000";
export const BG_ELEVATED = "#ECECEC";
export const TEXT_PRIMARY = "#000000";
export const TEXT_INVERSE = "#FFFFFF";
export const MUTED = "#5C5754";
export const BORDER = "#5C5754";
export const ACCENT_GREEN = "#9CAF88"; // single accent for "natural"

// ======================================
// Button Styles
// ======================================

export const BUTTON = {
  PRIMARY: {
    bg: "#000000",
    fg: "#FFFFFF",
    hover: "#1A1A1A",
    focus: "#000000",
    border: "#000000",
  },
  SECONDARY: {
    bg: "transparent",
    fg: "#000000",
    border: "#000000",
    hover: "#000000",
    hoverFg: "#FFFFFF",
  },
} as const;

// ======================================
// Link Styles
// ======================================

export const LINK = {
  color: "#000000",
  hoverUnderline: true,
  hoverAccent: "#9CAF88",
} as const;