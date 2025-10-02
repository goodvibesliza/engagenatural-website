import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ExternalLink, AlertCircle } from 'lucide-react';
import { listBrandTrainings, formatRelativeTime } from '../../lib/trainingAdapter';
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

  // Refs for DOM elements
  const comboboxRef = useRef(null);
  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load initial trainings and selected training data
  useEffect(() => {
    if (brandId) {
      loadTrainings('');
    }
  }, [brandId]);

  // Find and set selected training when value changes
  useEffect(() => {
    if (value && trainings.length > 0) {
      const training = trainings.find(t => t.id === value);
      setSelectedTraining(training || null);
    } else {
      setSelectedTraining(null);
    }
  }, [value, trainings]);

  // Load trainings with optional search query
  const loadTrainings = useCallback(async (query = '') => {
    if (!brandId) return;

    setLoading(true);
    setError(null);

    try {
      const results = await listBrandTrainings({
        brandId,
        query: query.trim(),
        limit: 20
      });
      setTrainings(results);
    } catch (err) {
      console.error('Error loading trainings:', err);
      setError('Failed to load trainings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={comboboxRef}>
      {/* Error Banner */}
      {error && (
        <div className=\"mb-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center text-sm text-red-600\" role=\"alert\" aria-live=\"polite\">
          <AlertCircle className=\"w-4 h-4 mr-2 flex-shrink-0\" />
          <span className=\"flex-1\">{error}</span>
          <button 
            onClick={() => setError(null)}
            className=\"ml-2 text-red-400 hover:text-red-600\"
            aria-label=\"Dismiss error\"\n          >\n            <X className=\"w-4 h-4\" />\n          </button>\n        </div>\n      )}\n\n      {/* Selected Training Display */}\n      {selectedTraining && !isOpen && (\n        <div className=\"flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md\">\n          <div className=\"flex items-center flex-1 min-w-0\">\n            <div className=\"flex-1 min-w-0\">\n              <div className=\"text-sm font-medium text-blue-900 truncate\">\n                {selectedTraining.title}\n              </div>\n              <div className=\"text-xs text-blue-600 mt-1\">\n                {selectedTraining.status} · {formatRelativeTime(selectedTraining.updatedAt)}\n              </div>\n            </div>\n          </div>\n          <div className=\"flex items-center space-x-2 ml-2\">\n            <button\n              type=\"button\"\n              onClick={(e) => openTraining(selectedTraining.id, e)}\n              className=\"p-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded\"\n              aria-label={`View training: ${selectedTraining.title}`}\n              data-testid=\"training-select-view\"\n            >\n              <ExternalLink className=\"w-4 h-4\" />\n            </button>\n            <button\n              type=\"button\"\n              onClick={clearSelection}\n              className=\"p-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded\"\n              aria-label=\"Clear training selection\"\n              data-testid=\"training-select-clear\"\n            >\n              <X className=\"w-4 h-4\" />\n            </button>\n          </div>\n        </div>\n      )}\n\n      {/* Combobox Input */}\n      <div className={selectedTraining && !isOpen ? 'mt-2' : ''}>\n        <div className=\"relative\">\n          <input\n            ref={inputRef}\n            type=\"text\"\n            role=\"combobox\"\n            aria-expanded={isOpen}\n            aria-haspopup=\"listbox\"\n            aria-label=\"Attach training\"\n            aria-describedby={error ? 'training-select-error' : undefined}\n            aria-activedescendant={activeDescendant >= 0 ? `training-option-${trainings[activeDescendant]?.id}` : undefined}\n            value={searchQuery}\n            onChange={(e) => handleSearchChange(e.target.value)}\n            onFocus={() => setIsOpen(true)}\n            onKeyDown={handleKeyDown}\n            placeholder={selectedTraining ? 'Search for different training...' : 'Search trainings...'}\n            className=\"w-full pl-10 pr-4 py-2 h-11 min-h-[44px] border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500\"\n            data-testid=\"training-select-input\"\n          />\n          <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400\" />\n        </div>\n      </div>\n\n      {/* Dropdown List */}\n      {isOpen && (\n        <div className=\"absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto\">\n          {loading ? (\n            <div className=\"p-4 text-center text-sm text-gray-500\">\n              <div className=\"animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2\"></div>\n              Loading trainings...\n            </div>\n          ) : trainings.length === 0 ? (\n            <div className=\"p-4 text-center text-sm text-gray-500\">\n              <div className=\"mb-1\">No trainings found</div>\n              <div className=\"text-xs text-gray-400\">Check your brand or try a different search.</div>\n            </div>\n          ) : (\n            <ul\n              ref={listboxRef}\n              role=\"listbox\"\n              aria-label=\"Training options\"\n              className=\"py-1\"\n            >\n              {trainings.map((training, index) => (\n                <li\n                  key={training.id}\n                  id={`training-option-${training.id}`}\n                  role=\"option\"\n                  aria-selected={activeDescendant === index}\n                  className={`px-3 py-2 cursor-pointer text-sm ${\n                    activeDescendant === index\n                      ? 'bg-blue-100 text-blue-900'\n                      : 'text-gray-900 hover:bg-gray-100'\n                  }`}\n                  onClick={() => selectTraining(training)}\n                  data-testid={`training-select-option-${training.id}`}\n                >\n                  <div className=\"flex items-center justify-between\">\n                    <div className=\"flex-1 min-w-0\">\n                      <div className=\"font-medium truncate\">{training.title}</div>\n                      <div className=\"flex items-center space-x-2 text-xs text-gray-500 mt-1\">\n                        <Badge \n                          variant={training.status === 'published' ? 'default' : 'secondary'}\n                          className=\"text-xs\"\n                        >\n                          {training.status}\n                        </Badge>\n                        <span>·</span>\n                        <span>{formatRelativeTime(training.updatedAt)}</span>\n                      </div>\n                    </div>\n                    <button\n                      type=\"button\"\n                      onClick={(e) => openTraining(training.id, e)}\n                      className=\"ml-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded\"\n                      aria-label={`View training: ${training.title}`}\n                      tabIndex={-1}\n                    >\n                      <ExternalLink className=\"w-3 h-3\" />\n                    </button>\n                  </div>\n                </li>\n              ))}\n            </ul>\n          )}\n        </div>\n      )}\n    </div>\n  );\n}