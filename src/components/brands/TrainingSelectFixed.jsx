import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ExternalLink, AlertCircle } from 'lucide-react';
import { listBrandTrainings, formatRelativeTime, findTrainingById } from '../../lib/trainingAdapter';
import { brandTrainingPreview } from '../../lib/analytics';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';

/**
 * Accessible training selector with search for Community Editor
 * Implements WAI-ARIA combobox pattern with keyboard navigation
 */
export default function TrainingSelect({
  value = '', // Selected training ID
  onSelect, // (training) => void - Called when training is selected
  onClear, // () => void - Called when selection is cleared
  brandId,
  className = ''
}) {
  // Component state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [activeDescendant, setActiveDescendant] = useState(-1);

  // Refs for DOM elements and request tracking
  const comboboxRef = useRef(null);
  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const requestIdRef = useRef(0);
  const fetchAbortControllerRef = useRef(null);

  // Load trainings with optional search query (moved before useEffect to fix dependency order)
  const loadTrainings = useCallback(async (query = '') => {
    if (!brandId) return;

    // Increment request ID and capture current ID for this request
    const currentRequestId = ++requestIdRef.current;
    
    // Abort previous request if it exists
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    fetchAbortControllerRef.current = abortController;

    // Only set loading if this is the current request
    if (currentRequestId === requestIdRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const results = await listBrandTrainings({
        brandId,
        query: query.trim(),
        limit: 20
      });
      
      // Only update state if this is still the current request
      if (currentRequestId === requestIdRef.current && !abortController.signal.aborted) {
        setTrainings(results);
      }
    } catch (err) {
      // Only handle error if this is still the current request and not aborted
      if (currentRequestId === requestIdRef.current && !abortController.signal.aborted) {
        console.error('Error loading trainings:', err);
        setError('Failed to load trainings. Please try again.');
      }
    } finally {
      // Only clear loading if this is still the current request
      if (currentRequestId === requestIdRef.current && !abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [brandId]);

  // Load initial trainings and selected training data
  useEffect(() => {
    if (brandId) {
      // Reset request tracking when brandId changes
      requestIdRef.current = 0;
      loadTrainings('');
    }
  }, [brandId, loadTrainings]);

  // Find and set selected training when value changes
  useEffect(() => {
    if (value) {
      // First try to find in current trainings
      const training = trainings.find(t => t.id === value);
      if (training) {
        setSelectedTraining(training);
      } else if (trainings.length > 0) {
        // If value exists but not found in current page, fetch by ID
        const fetchMissingTraining = async () => {
          try {
            const fetchedTraining = await findTrainingById(value);
            if (fetchedTraining) {
              setSelectedTraining(fetchedTraining);
            } else {
              // Training doesn't exist anymore, clear selection
              setSelectedTraining(null);
              onClear?.();
            }
          } catch (error) {
            console.error('Error fetching training by ID:', error);
            // Keep previous training or clear silently
            setSelectedTraining(null);
          }
        };
        
        fetchMissingTraining();
      }
    } else {
      setSelectedTraining(null);
    }
  }, [value, trainings, onClear]);



  // Debounced search
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setActiveDescendant(-1);

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
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setActiveDescendant(trainings.length > 0 ? 0 : -1);
      }
      return;
    }

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
          selectTraining(trainings[activeDescendant]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveDescendant(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Select a training
  const selectTraining = (training) => {
    setSelectedTraining(training);
    setIsOpen(false);
    setActiveDescendant(-1);
    setSearchQuery('');
    inputRef.current?.blur();
    onSelect?.(training);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTraining(null);
    setSearchQuery('');
    onClear?.();
  };

  // Open training in new tab for verification
  const openTraining = (trainingId, e) => {
    e.stopPropagation();
    window.open(`/staff/trainings/${trainingId}`, '_blank');
    // Track training preview
    brandTrainingPreview({ trainingId });
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveDescendant(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Cleanup timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={comboboxRef}>
      {/* Error Banner */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center text-sm text-red-600" role="alert" aria-live="polite">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Training Display */}
      {selectedTraining && !isOpen && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-blue-900 truncate">
                {selectedTraining.title}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {selectedTraining.status} · {formatRelativeTime(selectedTraining.updatedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <button
              type="button"
              onClick={(e) => openTraining(selectedTraining.id, e)}
              className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
              aria-label={`View training: ${selectedTraining.title}`}
              data-testid="training-select-view"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
              aria-label="Clear training selection"
              data-testid="training-select-clear"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Combobox Input */}
      <div className={selectedTraining && !isOpen ? 'mt-2' : ''}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label="Attach training"
            aria-describedby={error ? 'training-select-error' : undefined}
            aria-activedescendant={activeDescendant >= 0 ? `training-option-${trainings[activeDescendant]?.id}` : undefined}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTraining ? 'Search for different training...' : 'Search trainings...'}
            className="w-full pl-10 pr-4 py-2 h-11 min-h-[44px] border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="training-select-input"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
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
              ref={listboxRef}
              role="listbox"
              aria-label="Training options"
              className="py-1"
            >
              {trainings.map((training, index) => (
                <li
                  key={training.id}
                  id={`training-option-${training.id}`}
                  role="option"
                  aria-selected={activeDescendant === index}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    activeDescendant === index
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => selectTraining(training)}
                  data-testid={`training-select-option-${training.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{training.title}</div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Badge 
                          variant={training.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {training.status}
                        </Badge>
                        <span>·</span>
                        <span>{formatRelativeTime(training.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => openTraining(training.id, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                      aria-label={`View training: ${training.title}`}
                      tabIndex={-1}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}