// ======================================
// CultureTest Brand Button Component
// ======================================

import React from 'react';
import { BUTTON, ACCENT_GREEN } from '../../brand/palette';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const baseStyles = `
  inline-flex items-center justify-center
  font-medium text-sm
  border border-solid
  rounded-md
  transition-all duration-200 ease-in-out
  cursor-pointer
  disabled:opacity-50 disabled:cursor-not-allowed
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
`;

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

const getVariantStyles = (variant: 'primary' | 'secondary' | 'ghost') => {
  const focusRing = `focus-visible:outline-[${ACCENT_GREEN}]`;
  
  switch (variant) {
    case 'primary':
      return `
        bg-[${BUTTON.PRIMARY.bg}] 
        text-[${BUTTON.PRIMARY.fg}] 
        border-[${BUTTON.PRIMARY.border}]
        hover:bg-[${BUTTON.PRIMARY.hover}]
        ${focusRing}
      `;
    
    case 'secondary':
      return `
        bg-[${BUTTON.SECONDARY.bg}] 
        text-[${BUTTON.SECONDARY.fg}] 
        border-[${BUTTON.SECONDARY.border}]
        hover:bg-[${BUTTON.SECONDARY.hover}]
        hover:text-[${BUTTON.SECONDARY.hoverFg}]
        ${focusRing}
      `;
    
    case 'ghost':
      return `
        bg-transparent 
        text-black 
        border-transparent
        hover:underline hover:decoration-2 hover:decoration-[${ACCENT_GREEN}] hover:underline-offset-4
        ${focusRing}
      `;
    
    default:
      return getVariantStyles('primary');
  }
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = getVariantStyles(variant);
  const sizeClass = sizeStyles[size];
  
  const buttonClasses = `
    ${baseStyles}
    ${sizeClass}
    ${variantStyles}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button 
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  );
};