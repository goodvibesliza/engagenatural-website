import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Accessible confirmation dialog with keyboard trap for destructive actions
 * Implements ARIA Dialog pattern with focus management
 */
export default function AccessibleConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive'
}) {
  const dialogRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle keyboard navigation and focus trap
  useEffect(() => {
    if (!open) return;

    // Store the element that opened the dialog
    previousActiveElement.current = document.activeElement;

    // Focus the first focusable element
    const focusFirst = () => {
      if (firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }
    };

    // Focus trap handler
    const handleKeyDown = (e) => {
      if (!dialogRef.current) return;

      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Tab navigation - create focus trap
      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab - moving backward
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab - moving forward
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Focus first element after a brief delay to ensure rendering
    setTimeout(focusFirst, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      
      // Restore focus to the element that opened the dialog
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transform transition-all"
      >
        {/* Header */}
        <div className="flex items-start mb-4">
          <div className="flex items-center">
            {variant === 'destructive' && (
              <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
              </div>
            )}
            <div className={variant === 'destructive' ? 'ml-4' : ''}>
              <h3 
                id="confirm-dialog-title"
                className="text-lg font-medium text-gray-900"
              >
                {title}
              </h3>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="ml-auto -mr-2 -mt-2 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Description */}
        {description && (
          <div className="mb-6">
            <p 
              id="confirm-dialog-description"
              className="text-sm text-gray-500"
            >
              {description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            ref={firstFocusableRef}
            type="button"
            variant="ghost"
            onClick={handleCancel}
          >
            {cancelText}
          </Button>
          <Button
            ref={lastFocusableRef}
            type="button"
            variant={variant}
            onClick={handleConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}