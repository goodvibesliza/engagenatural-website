/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // EngageNatural Brand Colors
        "black": "#000000",
        "white": "#FFFFFF",
        "sage-green": "#9CAF88",
        "oat-beige": "#F5F1EB",
        "deep-moss": "#4A5D3A",
        "sage-light": "#B8C7A6",
        "sage-dark": "#7A8E6B",
        "moss-light": "#5C7048",
        "oat-dark": "#E8E1D5",
        "warm-gray": "#6B6B6B",
        "cool-gray": "#F8F9FA",
        
        // Map brand colors to functional color names
        primary: {
          DEFAULT: "#9CAF88", // sage-green
          foreground: "#000000", // black
        },
        secondary: {
          DEFAULT: "#4A5D3A", // deep-moss
          foreground: "#FFFFFF", // white
        },
        muted: {
          DEFAULT: "#F5F1EB", // oat-beige
          foreground: "#6B6B6B", // warm-gray
        },
        accent: {
          DEFAULT: "#B8C7A6", // sage-light
          foreground: "#4A5D3A", // deep-moss
        },
        
        // Brand aliases
        "brand-primary": "#9CAF88", // sage-green
        "brand-secondary": "#4A5D3A", // deep-moss
        "brand-accent": "#F5F1EB", // oat-beige
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.625rem',
        sm: 'calc(0.625rem - 4px)',
        md: 'calc(0.625rem - 2px)',
        lg: '0.625rem',
        xl: 'calc(0.625rem + 4px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
