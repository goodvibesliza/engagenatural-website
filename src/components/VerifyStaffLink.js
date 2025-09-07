import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A reusable navigation link component for the "Verify Staff" admin feature.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes to apply
 * @param {Object} [props.style] - Inline styles to apply
 * @param {string} [props.variant='button'] - Visual variant ('button', 'link', 'sidebar')
 * @param {React.ReactNode} [props.children] - Optional children to replace default text
 * @returns {React.ReactElement} The rendered component
 */
const VerifyStaffLink = ({ 
  className = '', 
  style = {}, 
  variant = 'button',
  children,
  ...rest 
}) => {
  // Base styles for different variants
  const variantStyles = {
    button: 'px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors',
    link: 'text-purple-600 hover:text-purple-800 hover:underline transition-colors',
    sidebar: 'flex items-center px-4 py-2 text-gray-700 hover:bg-purple-100 hover:text-purple-700 rounded transition-colors'
  };

  // Get the appropriate variant style or default to empty string if not found
  const variantStyle = variantStyles[variant] || '';

  return (
    <Link
      to="/admin/verify"
      className={`verify-staff-link ${variantStyle} ${className}`}
      style={style}
      {...rest}
    >
      {children || (
        <>
          {variant === 'sidebar' && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          )}
          Verify Staff
        </>
      )}
    </Link>
  );
};

export default VerifyStaffLink;
