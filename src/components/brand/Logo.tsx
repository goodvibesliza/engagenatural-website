// ======================================
// CultureTest Brand Logo Component
// ======================================

import React from 'react';

interface LogoProps {
  variant?: 'auto' | 'light' | 'dark' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { height: 24, width: 24 },
  md: { height: 32, width: 32 }, 
  lg: { height: 40, width: 40 },
} as const;

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'auto', 
  size = 'md',
  className = '' 
}) => {
  const dimensions = SIZES[size];
  
  // Determine which logo variant to use
  const getLogoSrc = (variant: string): string => {
    switch (variant) {
      case 'light':
        return '/logo.svg';
      case 'dark':
        return '/logo-invert.svg';
      case 'accent':
        return '/logo-accent.svg';
      case 'auto':
      default:
        // For auto mode, use media query or class detection
        // Default to light variant for now
        return '/logo.svg';
    }
  };

  const logoSrc = getLogoSrc(variant);
  
  // Auto variant logic would use CSS to switch between versions
  if (variant === 'auto') {
    return (
      <div className={`relative ${className}`} style={dimensions}>
        {/* Light version (default) */}
        <img 
          src="/logo.svg"
          alt="CultureTest logo"
          className="block dark:hidden"
          style={dimensions}
        />
        {/* Dark version (for dark mode) */}
        <img 
          src="/logo-invert.svg"
          alt="CultureTest logo"
          className="hidden dark:block"
          style={dimensions}
        />
      </div>
    );
  }

  return (
    <img 
      src={logoSrc}
      alt="CultureTest logo"
      className={className}
      style={dimensions}
    />
  );
};