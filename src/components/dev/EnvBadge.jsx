// src/components/dev/EnvBadge.jsx
import React from 'react';

/**
 * Environment indicator badge that displays in the bottom-left corner
 * Shows "Emulator" when using Firebase emulators
 * Shows "Production" when using real Firebase (but only in dev builds)
 */
const EnvBadge = () => {
  const isEmu = import.meta.env.VITE_USE_EMULATOR === 'true';
  const isDev = import.meta.env.DEV;
  
  // Only render in emulator mode or in development builds
  if (!isEmu && !isDev) return null;
  
  // Base styles for the badge
  const baseStyles = 'fixed left-3 bottom-3 z-[9999] select-none rounded px-2.5 py-1 text-xs font-medium shadow-lg backdrop-blur';
  
  // If emulator is active, show green badge
  if (isEmu) {
    return (
      <div className={`${baseStyles} bg-green-600/90 text-white`}>
        🧪 Emulator
      </div>
    );
  }
  
  // If in development but not emulator, show production badge
  if (isDev) {
    return (
      <div className={`${baseStyles} bg-amber-600/90 text-white`}>
        🚀 Production
      </div>
    );
  }
  
  return null;
};

export default EnvBadge;
