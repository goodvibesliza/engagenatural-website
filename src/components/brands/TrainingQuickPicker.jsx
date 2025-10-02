import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { listBrandTrainings, formatRelativeTime } from '../../lib/trainingAdapter';
import { Badge } from '../ui/badge';

/**
 * Compact training picker popover for inline post actions
 * Implements WAI-ARIA combobox pattern with keyboard navigation
 */
export default function TrainingQuickPicker({
  brandId,
  onSelect, // (training) => void
  onClose, // () => void
  className = ''
}) {
  // Component state
  const [searchQuery, setSearchQuery] = useState('');
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeDescendant, setActiveDescendant] = useState(-1);

  // Refs for DOM elements
  const popoverRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load trainings on mount and focus input
  useEffect(() => {
    loadTrainings('');
    // Focus input when popover opens
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Load trainings with search query
  const loadTrainings = useCallback(async (query = '') => {
    if (!brandId) return;

    setLoading(true);
    setError(null);

    try {
      const results = await listBrandTrainings({
        brandId,
        query: query.trim(),
        limit: 10 // Smaller limit for quick picker
      });
      setTrainings(results);
      setActiveDescendant(-1); // Reset selection on new results
    } catch (err) {
      console.error('Error loading trainings:', err);
      setError('Failed to load trainings');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  // Debounced search handler
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      loadTrainings(query);
    }, 250);
  }, [loadTrainings]);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveDescendant(prev => 
          prev < trainings.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveDescendant(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeDescendant >= 0 && trainings[activeDescendant]) {
          handleSelect(trainings[activeDescendant]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Handle training selection
  const handleSelect = (training) => {
    onSelect(training);
    onClose();
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={popoverRef}
      className={`w-80 bg-white border border-gray-300 rounded-md shadow-lg ${className}`}
    >
      {/* Search Input */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-haspopup="listbox"
            aria-label="Search trainings"
            aria-activedescendant={activeDescendant >= 0 ? `quickpicker-option-${trainings[activeDescendant]?.id}` : undefined}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search trainings…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="quickpicker-input"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                loadTrainings('');
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Training List */}
      <div className="max-h-60 overflow-y-auto">
        {error ? (
          <div className="p-4 text-center text-sm text-red-600">
            {error}
          </div>
        ) : loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading trainings...
          </div>
        ) : trainings.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <div className="mb-1">No trainings found</div>
            <div className="text-xs text-gray-400">Check your brand or try a different search.</div>
          </div>
        ) : (
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Training options"
            className="py-1"
          >
            {trainings.map((training, index) => (
              <li
                key={training.id}
                id={`quickpicker-option-${training.id}`}
                role="option"
                aria-selected={activeDescendant === index}
                className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                  activeDescendant === index
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => handleSelect(training)}
                onMouseEnter={() => setActiveDescendant(index)}
                data-testid={`quickpicker-option-${training.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{training.title}</div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <Badge 
                        variant={training.status === 'published' ? 'default' : 'secondary'}
                        className="text-xs px-1 py-0"
                      >
                        {training.status}
                      </Badge>
                      <span>·</span>
                      <span>{formatRelativeTime(training.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}