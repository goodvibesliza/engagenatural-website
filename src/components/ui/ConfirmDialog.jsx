import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Accessible confirmation dialog with keyboard trap for destructive actions
 * Implements ARIA Dialog pattern with focus management
 */
export default function ConfirmDialog({
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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
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
    <div className=\"fixed inset-0 z-50 flex items-center justify-center\">
      {/* Backdrop */}\n      <div \n        className=\"fixed inset-0 bg-black bg-opacity-50 transition-opacity\"\n        onClick={onClose}\n        aria-hidden=\"true\"\n      />\n\n      {/* Dialog */}\n      <div\n        ref={dialogRef}\n        role=\"dialog\"\n        aria-modal=\"true\"\n        aria-labelledby=\"confirm-dialog-title\"\n        aria-describedby=\"confirm-dialog-description\"\n        className=\"relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transform transition-all\"\n      >\n        {/* Header */}\n        <div className=\"flex items-start mb-4\">\n          <div className=\"flex items-center\">\n            {variant === 'destructive' && (\n              <div className=\"flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100\">\n                <AlertTriangle className=\"w-6 h-6 text-red-600\" aria-hidden=\"true\" />\n              </div>\n            )}\n            <div className={variant === 'destructive' ? 'ml-4' : ''}>\n              <h3 \n                id=\"confirm-dialog-title\"\n                className=\"text-lg font-medium text-gray-900\"\n              >\n                {title}\n              </h3>\n            </div>\n          </div>\n          \n          <button\n            type=\"button\"\n            onClick={onClose}\n            className=\"ml-auto -mr-2 -mt-2 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded\"\n            aria-label=\"Close dialog\"\n          >\n            <X className=\"w-5 h-5\" aria-hidden=\"true\" />\n          </button>\n        </div>\n\n        {/* Description */}\n        {description && (\n          <div className=\"mb-6\">\n            <p \n              id=\"confirm-dialog-description\"\n              className=\"text-sm text-gray-500\"\n            >\n              {description}\n            </p>\n          </div>\n        )}\n\n        {/* Actions */}\n        <div className=\"flex gap-3 justify-end\">\n          <Button\n            ref={firstFocusableRef}\n            type=\"button\"\n            variant=\"ghost\"\n            onClick={handleCancel}\n          >\n            {cancelText}\n          </Button>\n          <Button\n            ref={lastFocusableRef}\n            type=\"button\"\n            variant={variant}\n            onClick={handleConfirm}\n            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}\n          >\n            {confirmText}\n          </Button>\n        </div>\n      </div>\n    </div>\n  );\n}