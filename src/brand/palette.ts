/**
 * Shared EngageNatural brand palette used across UI components.
 * Duplicates the colour tokens defined in Tailwind/theme CSS so
 * TypeScript imports like "../../brand/palette" resolve correctly.
 */

export const brandPalette = {
	neutrals: {
		black: '#000000',
		white: '#FFFFFF',
	},
	primary: {
		base: '#9CAF88',
		foreground: '#000000',
	},
	secondary: {
		base: '#4A5D3A',
		foreground: '#FFFFFF',
	},
	accent: {
		base: '#B8C7A6',
		foreground: '#4A5D3A',
	},
	muted: {
		base: '#F5F1EB',
		foreground: '#6B6B6B',
	},
} as const;

export type BrandPalette = typeof brandPalette;

export type BrandPaletteKey =
	| 'neutrals.black'
	| 'neutrals.white'
	| 'primary.base'
	| 'primary.foreground'
	| 'secondary.base'
	| 'secondary.foreground'
	| 'accent.base'
	| 'accent.foreground'
	| 'muted.base'
	| 'muted.foreground';

const paletteLookup: Record<BrandPaletteKey, string> = {
	'neutrals.black': brandPalette.neutrals.black,
	'neutrals.white': brandPalette.neutrals.white,
	'primary.base': brandPalette.primary.base,
	'primary.foreground': brandPalette.primary.foreground,
	'secondary.base': brandPalette.secondary.base,
	'secondary.foreground': brandPalette.secondary.foreground,
	'accent.base': brandPalette.accent.base,
	'accent.foreground': brandPalette.accent.foreground,
	'muted.base': brandPalette.muted.base,
	'muted.foreground': brandPalette.muted.foreground,
};

export function getBrandColor(token: BrandPaletteKey): string {
	return paletteLookup[token];
}

export default brandPalette;
