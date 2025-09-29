export type LogoItem = { src: string; alt: string; href?: string }

import placeholderA from '../assets/brand-logos/placeholder-a.svg'
import placeholderB from '../assets/brand-logos/placeholder-b.svg'
import placeholderC from '../assets/brand-logos/placeholder-c.svg'
import placeholderD from '../assets/brand-logos/placeholder-d.svg'

export const BRAND_LOGOS: LogoItem[] = [
  { src: '/bach-flower.svg',   alt: 'Bach Original Flower Remedies', href: 'https://bachremedies.com' },
  { src: placeholderA, alt: 'Brand A' },
  { src: placeholderB, alt: 'Brand B' },
  { src: placeholderC, alt: 'Brand C' },
  { src: placeholderD, alt: 'Brand D' },
]
