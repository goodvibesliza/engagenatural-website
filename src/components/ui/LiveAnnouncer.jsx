import React, { useEffect, useRef } from 'react';

/**
 * Accessible live announcer for screen readers
 * Replaces alert() with proper aria-live announcements
 */
export default function LiveAnnouncer({ message, type = 'polite', onClear }) {
  const announcerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (message && announcerRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Clear previous content first
      announcerRef.current.textContent = '';
      
      // Small delay to ensure screen readers catch the change
      timeoutRef.current = setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);

      // Clear after announcement
      const clearTimeoutId = setTimeout(() => {
        if (onClear) onClear();
      }, 5000);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        clearTimeout(clearTimeoutId);
      };
    }
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div 
      ref={announcerRef}
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    />
  );
}

/**
 * Hook for managing announcements
 */
export function useAnnouncements() {
  const [announcement, setAnnouncement] = React.useState('');
  const [politeness, setPoliteness] = React.useState('polite');

  const announce = React.useCallback((message, type = 'polite') => {
    setAnnouncement(message);
    setPoliteness(type);
  }, []);

  const clear = React.useCallback(() => {
    setAnnouncement('');
  }, []);

  return { announcement, announce, clear, politeness };
}
