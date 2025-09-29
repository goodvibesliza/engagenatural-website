export type LogoItem = { src: string; alt: string; href?: string }

import bach from '../assets/brand-logos/bach-flower.svg'
import logo339 from '../assets/brand-logos/logoipsum-339.svg'
import logo366 from '../assets/brand-logos/logoipsum-366.svg'
import logo371 from '../assets/brand-logos/logoipsum-371.svg'
import logo392 from '../assets/brand-logos/logoipsum-392.svg'

export const BRAND_LOGOS: LogoItem[] = [
  { src: bach, alt: 'Bach Original Flower Remedies', href: 'https://bachremedies.com' },
  { src: logo339, alt: 'Logo 339' },
  { src: logo366, alt: 'Logo 366' },
  { src: logo371, alt: 'Logo 371' },
  { src: logo392, alt: 'Logo 392' },
]
