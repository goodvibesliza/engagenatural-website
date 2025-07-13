import React, { useState, useEffect, useRef } from 'react';
import { postCategories } from '../utils/CommunityUtils';

/**
 * Community Search Component
 * Provides search, filtering, and sorting functionality for community posts
 */
const CommunitySearch = ({
  onSearch,
  selectedCategory,
  setSelectedCategory,
  activeSort,
  setActiveSort,
  showAdvancedSearch,
  setShowAdvancedSearch,
  advancedFilters,
  setAdvancedFilters,
  categories = [],
  getCategoryInfo
}) => {
  // Local state for search input
  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounce
    const timeout = setTimeout(() => {
      onSearch(value, advancedFilters);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchInput, advancedFilters);
  };

  // Handle category selection
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Handle sort selection
  const handleSortChange = (sortType) => {
    setActiveSort(sortType);
  };

  // Handle advanced filter changes
  const handleFilterChange = (key, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Trigger search with updated filters
    onSearch(searchInput, {
      ...advancedFilters,
      [key]: value
    });
  };

  // Toggle advanced search visibility
  const toggleAdvancedSearch = () => {
    setShowAdvancedSearch(!showAdvancedSearch);
  };

  // Handle clicks outside the filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get available categories
  const getAvailableCategories = () => {
    if (!categories || categories.length === 0) {
      return postCategories;
    }
    
    return postCategories.filter(category => 
      categories.includes(category.id)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Form */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search posts, hashtags, or users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700"
          >
            Search
          </button>
        </div>
      </form>
      
      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        {/* Category Filter */}
        <div className="relative flex-grow">
          <label htmlFor="category-filter" className="block text-xs font-medium text-gray-500 mb-1">
            Category
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
          >
            <option value="all">All Categories</option>
            {getAvailableCategories().map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Sort Options */}
        <div className="relative">
          <label htmlFor="sort-options" className="block text-xs font-medium text-gray-500 mb-1">
            Sort By
          </label>
          <div className="flex space-x-1 h-[38px]">
            <button
              type="button"
              onClick={() => handleSortChange('newest')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeSort === 'newest'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('popular')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeSort === 'popular'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Popular
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('discussed')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeSort === 'discussed'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Most Discussed
            </button>
          </div>
        </div>
        
        {/* Advanced Search Toggle */}
        <div className="relative flex items-end">
          <button
            type="button"
            onClick={toggleAdvancedSearch}
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {showAdvancedSearch ? 'Hide Filters' : 'Advanced Filters'}
          </button>
        </div>
      </div>
      
      {/* Advanced Search Options */}
      {showAdvancedSearch && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label htmlFor="date-range" className="block text-xs font-medium text-gray-500 mb-1">
                Date Range
              </label>
              <select
                id="date-range"
                value={advancedFilters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            {/* Media Filter */}
            <div className="flex items-center">
              <input
                id="has-media"
                type="checkbox"
                checked={advancedFilters.hasMedia}
                onChange={(e) => handleFilterChange('hasMedia', e.target.checked)}
                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
              />
              <label htmlFor="has-media" className="ml-2 block text-sm text-gray-700">
                Has Media (Images/Videos)
              </label>
            </div>
            
            {/* Verified Only */}
            <div className="flex items-center">
              <input
                id="verified-only"
                type="checkbox"
                checked={advancedFilters.verifiedOnly}
                onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
              />
              <label htmlFor="verified-only" className="ml-2 block text-sm text-gray-700">
                Verified Users Only
              </label>
            </div>
            
            {/* Expert Content */}
            <div className="flex items-center">
              <input
                id="expert-content"
                type="checkbox"
                checked={advancedFilters.expertContent}
                onChange={(e) => handleFilterChange('expertContent', e.target.checked)}
                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
              />
              <label htmlFor="expert-content" className="ml-2 block text-sm text-gray-700">
                Expert Content Only
              </label>
            </div>
            
            {/* Min Likes */}
            <div>
              <label htmlFor="min-likes" className="block text-xs font-medium text-gray-500 mb-1">
                Minimum Likes
              </label>
              <input
                id="min-likes"
                type="number"
                min="0"
                value={advancedFilters.minLikes}
                onChange={(e) => handleFilterChange('minLikes', parseInt(e.target.value) || 0)}
                className="block w-full pl-3 pr-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md"
              />
            </div>
            
            {/* Min Comments */}
            <div>
              <label htmlFor="min-comments" className="block text-xs font-medium text-gray-500 mb-1">
                Minimum Comments
              </label>
              <input
                id="min-comments"
                type="number"
                min="0"
                value={advancedFilters.minComments}
                onChange={(e) => handleFilterChange('minComments', parseInt(e.target.value) || 0)}
                className="block w-full pl-3 pr-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md"
              />
            </div>
          </div>
          
          {/* Reset Filters */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const defaultFilters = {
                  dateRange: 'all',
                  hasMedia: false,
                  verifiedOnly: false,
                  expertContent: false,
                  minLikes: 0,
                  minComments: 0
                };
                setAdvancedFilters(defaultFilters);
                onSearch(searchInput, defaultFilters);
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Active Filters Display */}
      {(selectedCategory !== 'all' || searchInput || 
        advancedFilters.dateRange !== 'all' || 
        advancedFilters.hasMedia || 
        advancedFilters.verifiedOnly || 
        advancedFilters.expertContent || 
        advancedFilters.minLikes > 0 || 
        advancedFilters.minComments > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {/* Category Filter Tag */}
            {selectedCategory !== 'all' && (
              <div className="flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">Category: {getCategoryInfo(selectedCategory).name}</span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Search Term Tag */}
            {searchInput && (
              <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">Search: {searchInput}</span>
                <button
                  onClick={() => {
                    setSearchInput('');
                    onSearch('', advancedFilters);
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Date Range Tag */}
            {advancedFilters.dateRange !== 'all' && (
              <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">
                  {advancedFilters.dateRange === 'today' ? 'Today' : 
                   advancedFilters.dateRange === 'week' ? 'This Week' :
                   advancedFilters.dateRange === 'month' ? 'This Month' : 'This Year'}
                </span>
                <button
                  onClick={() => handleFilterChange('dateRange', 'all')}
                  className="text-green-500 hover:text-green-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Has Media Tag */}
            {advancedFilters.hasMedia && (
              <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">Has Media</span>
                <button
                  onClick={() => handleFilterChange('hasMedia', false)}
                  className="text-purple-500 hover:text-purple-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Verified Only Tag */}
            {advancedFilters.verifiedOnly && (
              <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">Verified Only</span>
                <button
                  onClick={() => handleFilterChange('verifiedOnly', false)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Expert Content Tag */}
            {advancedFilters.expertContent && (
              <div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">Expert Content</span>
                <button
                  onClick={() => handleFilterChange('expertContent', false)}
                  className="text-yellow-500 hover:text-yellow-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Min Likes Tag */}
            {advancedFilters.minLikes > 0 && (
              <div className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">Min Likes: {advancedFilters.minLikes}</span>
                <button
                  onClick={() => handleFilterChange('minLikes', 0)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Min Comments Tag */}
            {advancedFilters.minComments > 0 && (
              <div className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">Min Comments: {advancedFilters.minComments}</span>
                <button
                  onClick={() => handleFilterChange('minComments', 0)}
                  className="text-orange-500 hover:text-orange-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySearch;
