// src/components/community/ErrorBanner.jsx
import { useEffect, useRef } from 'react';

export default function ErrorBanner({ message, onDismiss }) {
  const ref = useRef(null);
  useEffect(() => {
    // Announce to screen readers when mounted
    if (ref.current) {
      // no-op: role and aria-live handle announcement
    }
  }, []);
  if (!message) return null;
  return (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md px-3 py-2"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 px-2 h-8 min-h-[32px] rounded bg-red-100 text-red-800 hover:bg-red-200"
      >
        ×
      </button>
    </div>
  );
}
