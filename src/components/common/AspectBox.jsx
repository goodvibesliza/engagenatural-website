// src/components/common/AspectBox.jsx
import React from 'react';

export default function AspectBox({ ratio = '16/9', className = '', children }) {
  const [w, h] = String(ratio).split('/').map((n) => Number(n) || 1);
  const paddingTop = `${(h / w) * 100}%`;

  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      {/* Fallback for browsers without aspect-ratio support */}
      <div style={{ paddingTop }} aria-hidden />
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
